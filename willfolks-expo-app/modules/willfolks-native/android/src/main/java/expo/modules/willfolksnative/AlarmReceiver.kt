package expo.modules.willfolksnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Fires when a scheduled alarm is due: starts the ringing service and books the next day. */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != AlarmScheduler.ACTION_FIRE) return
    val id = intent.getStringExtra(AlarmScheduler.EXTRA_ID) ?: return
    val store = AlarmStore(context)
    val alarm = store.find(id) ?: return

    AlarmService.start(context, alarm)

    if (alarm.test) {
      store.remove(id)
    } else {
      // A minute of margin so the occurrence that just fired is never picked again.
      AlarmScheduler.schedule(context, alarm, System.currentTimeMillis() + 60_000)
    }
  }
}

/** AlarmManager forgets everything on reboot and exact times shift with the clock. */
class AlarmRestoreReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED -> AlarmScheduler.rescheduleAll(context)
    }
  }
}
