package expo.modules.willfolksnative

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/** Schedules alarm goals with AlarmManager so they ring exactly on time, even in Doze. */
internal object AlarmScheduler {
  const val ACTION_FIRE = "expo.modules.willfolksnative.ALARM_FIRE"
  const val EXTRA_ID = "alarmId"

  /** Replaces every scheduled alarm with the given set. */
  fun sync(context: Context, alarms: List<StoredAlarm>) {
    val store = AlarmStore(context)
    store.alarms().forEach { cancel(context, it.id) }
    store.replace(alarms)
    alarms.forEach { schedule(context, it) }
  }

  /** Puts stored alarms back after a reboot, an app update or a clock change. */
  fun rescheduleAll(context: Context) {
    AlarmStore(context).alarms().filterNot { it.test }.forEach { schedule(context, it) }
  }

  /** Schedules the next occurrence after [after]; returns its time, or null when none is left. */
  fun schedule(context: Context, alarm: StoredAlarm, after: Long = System.currentTimeMillis()): Long? {
    val at = nextTrigger(alarm, after) ?: return null
    scheduleAt(context, alarm.id, at)
    return at
  }

  fun scheduleAt(context: Context, id: String, at: Long) {
    val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val operation = firePendingIntent(context, id)
    if (canScheduleExact(context)) {
      // setAlarmClock is the one API the system never defers, and it shows the alarm icon.
      manager.setAlarmClock(AlarmManager.AlarmClockInfo(at, launchPendingIntent(context)), operation)
    } else {
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, operation)
    }
  }

  fun cancel(context: Context, id: String) {
    val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    manager.cancel(firePendingIntent(context, id))
  }

  fun canScheduleExact(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    return (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).canScheduleExactAlarms()
  }

  /** First moment after [after] that falls on an active week day inside the goal's dates. */
  fun nextTrigger(alarm: StoredAlarm, after: Long): Long? {
    for (offset in 0..7) {
      val candidate = Calendar.getInstance().apply {
        timeInMillis = after
        add(Calendar.DAY_OF_YEAR, offset)
        set(Calendar.HOUR_OF_DAY, alarm.hour)
        set(Calendar.MINUTE, alarm.minute)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      if (candidate.timeInMillis <= after) continue
      val day = localDay(candidate.timeInMillis)
      // ISO dates compare correctly as strings.
      if (day < alarm.startDate || day > alarm.endDate) continue
      if (candidate.get(Calendar.DAY_OF_WEEK) - 1 !in alarm.days) continue
      return candidate.timeInMillis
    }
    return null
  }

  fun localDay(millis: Long): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(millis)

  fun launchPendingIntent(context: Context): PendingIntent {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: Intent(Intent.ACTION_MAIN).setPackage(context.packageName)
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun firePendingIntent(context: Context, id: String): PendingIntent {
    val intent = Intent(context, AlarmReceiver::class.java)
      .setAction(ACTION_FIRE)
      // The data URI makes each alarm's intent distinct, so they do not overwrite each other.
      .setData(Uri.parse("willfolks-alarm://$id"))
      .putExtra(EXTRA_ID, id)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
}
