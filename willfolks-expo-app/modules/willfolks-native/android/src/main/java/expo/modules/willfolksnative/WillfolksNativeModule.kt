package expo.modules.willfolksnative

import android.app.NotificationManager
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.lang.ref.WeakReference

class AlarmSpec : Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var hour: Int = 0
  @Field var minute: Int = 0
  @Field var days: List<Int> = emptyList()
  @Field var startDate: String = ""
  @Field var endDate: String = ""
  @Field var reactionSeconds: Int = 60
  @Field var vibrate: Boolean = true
  @Field var stake: Double = 0.0

  internal fun toStored(test: Boolean = false) =
    StoredAlarm(id, title, hour, minute, days, startDate, endDate, reactionSeconds.coerceIn(5, 900), vibrate, stake, test)
}

/** Android-only features WillFolks needs that no Expo package covers: alarms, app usage and the widget. */
class WillfolksNativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("WillfolksNative")

    Events("onAlarmRinging", "onAlarmFinished")

    OnCreate { instance = WeakReference(this@WillfolksNativeModule) }
    OnDestroy { instance = null }

    // ------------------------------------------------------------- alarms

    /** Replaces the scheduled alarms; returns the next ring time (ms) of each, by id. */
    AsyncFunction("syncAlarms") { specs: List<AlarmSpec> ->
      val alarms = specs.map { it.toStored() }
      AlarmScheduler.sync(context, alarms)
      val now = System.currentTimeMillis()
      alarms.mapNotNull { alarm -> AlarmScheduler.nextTrigger(alarm, now)?.let { alarm.id to it.toDouble() } }.toMap()
    }

    /** Rings once in `delaySeconds`, through the same path as a real alarm, leaving no result. */
    AsyncFunction("scheduleTestAlarm") { spec: AlarmSpec, delaySeconds: Int ->
      val alarm = spec.toStored(test = true)
      AlarmStore(context).put(alarm)
      AlarmScheduler.scheduleAt(context, alarm.id, System.currentTimeMillis() + delaySeconds.coerceIn(1, 3600) * 1000L)
    }

    Function("getActiveAlarm") { activeAlarm()?.toMap() }

    AsyncFunction("dismissAlarm") { AlarmService.dismiss(context) }

    /** Outcomes not yet reported to the backend. Acknowledge them once they are. */
    Function("getAlarmResults") {
      activeAlarm()
      AlarmStore(context).results().map { it.toMap() }
    }

    Function("acknowledgeAlarmResults") { keys: List<String> -> AlarmStore(context).acknowledge(keys) }

    Function("canScheduleExactAlarms") { AlarmScheduler.canScheduleExact(context) }

    AsyncFunction("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        open(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, packageUri()))
      }
    }

    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) true
      else (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).canUseFullScreenIntent()
    }

    AsyncFunction("openFullScreenIntentSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        open(Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, packageUri()))
      }
    }

    /** Lets the ringing screen show over the lock screen and wake the display. */
    AsyncFunction("setShowWhenLocked") { enabled: Boolean ->
      val activity = appContext.currentActivity ?: return@AsyncFunction
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        activity.runOnUiThread {
          activity.setShowWhenLocked(enabled)
          activity.setTurnScreenOn(enabled)
        }
      }
    }

    // ------------------------------------------------------------- app usage

    Function("hasUsageAccess") { UsageReader.hasAccess(context) }

    AsyncFunction("openUsageAccessSettings") {
      // Some OEM builds do not accept the package-specific form; fall back to the list.
      runCatching { open(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, packageUri())) }
        .onFailure { open(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }
    }

    /** Minutes in the foreground per app between two timestamps (ms), busiest first. */
    AsyncFunction("getUsageStats") { startMs: Double, endMs: Double ->
      if (!UsageReader.hasAccess(context)) return@AsyncFunction emptyList<Map<String, Any>>()
      UsageReader.foregroundMillis(context, startMs.toLong(), endMs.toLong())
        .filter { it.value >= 1000 }
        .entries
        .sortedByDescending { it.value }
        .map { (pkg, millis) ->
          mapOf("packageName" to pkg, "appName" to UsageReader.label(context, pkg), "minutes" to millis / 60_000.0)
        }
    }

    AsyncFunction("getInstalledApps") { UsageReader.launchableApps(context) }

    // ------------------------------------------------------------- widget

    AsyncFunction("updateWidget") { data: Map<String, String> -> WillfolksWidgetProvider.save(context, data) }

    /** Asks the launcher to pin the widget. False when the launcher cannot do it. */
    AsyncFunction("requestPinWidget") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@AsyncFunction false
      val manager = AppWidgetManager.getInstance(context)
      if (!manager.isRequestPinAppWidgetSupported) return@AsyncFunction false
      manager.requestPinAppWidget(ComponentName(context, WillfolksWidgetProvider::class.java), null, null)
    }
  }

  /**
   * The alarm ringing now. If the process died mid-ring the stored alarm is stale:
   * its window is over, so it is settled as missed here.
   */
  private fun activeAlarm(): ActiveAlarm? {
    val store = AlarmStore(context)
    val active = store.active ?: return null
    val deadline = active.firedAt + (active.alarm.reactionSeconds + 10) * 1000L
    if (System.currentTimeMillis() <= deadline) return active
    if (!active.alarm.test) {
      store.addResult(AlarmResult(active.alarm.id, active.scheduledFor, AlarmService.RESULT_FAIL, active.alarm.reactionSeconds))
    }
    store.active = null
    return null
  }

  private fun packageUri() = Uri.parse("package:${context.packageName}")

  private fun open(intent: Intent) {
    context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  companion object {
    private var instance: WeakReference<WillfolksNativeModule>? = null

    /** Sends an event to JS if the runtime is alive; the stored state covers the case where it is not. */
    internal fun emit(name: String, body: Map<String, Any?>) {
      runCatching { instance?.get()?.sendEvent(name, body) }
    }
  }
}
