package expo.modules.willfolksnative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/**
 * Rings an alarm goal: plays the alarm sound, vibrates and shows a full-screen
 * notification until the user says they are awake or the reaction window runs out.
 * Either way the outcome is stored for the app to report to the backend.
 */
class AlarmService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private val timeout = Runnable { finish(RESULT_FAIL) }
  private var player: MediaPlayer? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var ringing: ActiveAlarm? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START -> {
        val alarm = intent.getStringExtra(EXTRA_ALARM)?.let { StoredAlarm.fromJson(org.json.JSONObject(it)) }
        if (alarm == null || ringing != null) {
          // Still has to honour the startForegroundService contract before bailing out.
          if (ringing == null) stopSelf()
        } else {
          ring(alarm)
        }
      }
      ACTION_DISMISS -> if (ringing != null) finish(RESULT_SUCCESS) else stopSelf()
      else -> if (ringing == null) stopSelf()
    }
    return START_NOT_STICKY
  }

  private fun ring(alarm: StoredAlarm) {
    val now = System.currentTimeMillis()
    val active = ActiveAlarm(alarm, now, AlarmScheduler.localDay(now))
    ringing = active
    AlarmStore(this).active = active

    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK else 0
    ServiceCompat.startForeground(this, NOTIFICATION_RINGING, ringingNotification(alarm), type)

    wakeLock = (getSystemService(Context.POWER_SERVICE) as PowerManager)
      .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "willfolks:alarm")
      .apply { acquire((alarm.reactionSeconds + 5) * 1000L) }

    startSound()
    if (alarm.vibrate) startVibration()
    handler.postDelayed(timeout, alarm.reactionSeconds * 1000L)
    WillfolksNativeModule.emit("onAlarmRinging", active.toMap())
  }

  private fun finish(result: String) {
    val active = ringing ?: return
    ringing = null
    handler.removeCallbacks(timeout)
    stopSound()
    vibrator().cancel()

    val store = AlarmStore(this)
    val reaction = ((System.currentTimeMillis() - active.firedAt) / 1000).toInt()
    if (!active.alarm.test) {
      store.addResult(AlarmResult(active.alarm.id, active.scheduledFor, result, reaction))
    }
    store.active = null
    WillfolksNativeModule.emit(
      "onAlarmFinished",
      mapOf("id" to active.alarm.id, "result" to result, "test" to active.alarm.test, "reactionSeconds" to reaction)
    )

    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    if (result == RESULT_FAIL && !active.alarm.test) notifyMissed(active.alarm)
    wakeLock?.takeIf { it.isHeld }?.release()
    stopSelf()
  }

  override fun onDestroy() {
    handler.removeCallbacks(timeout)
    stopSound()
    vibrator().cancel()
    wakeLock?.takeIf { it.isHeld }?.release()
    super.onDestroy()
  }

  private fun startSound() {
    val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
      ?: return
    player = runCatching {
      MediaPlayer().apply {
        // USAGE_ALARM plays on the alarm volume and ignores silent mode.
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        )
        setDataSource(this@AlarmService, uri)
        isLooping = true
        prepare()
        start()
      }
    }.getOrNull()
  }

  private fun stopSound() {
    player?.runCatching {
      stop()
      release()
    }
    player = null
  }

  private fun startVibration() {
    val pattern = longArrayOf(0, 600, 500)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator().vibrate(VibrationEffect.createWaveform(pattern, 0))
    } else {
      @Suppress("DEPRECATION")
      vibrator().vibrate(pattern, 0)
    }
  }

  @Suppress("DEPRECATION")
  private fun vibrator() = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator

  private fun ringingNotification(alarm: StoredAlarm): Notification {
    ensureChannel()
    val open = AlarmScheduler.launchPendingIntent(this)
    val dismiss = PendingIntent.getService(
      this,
      1,
      Intent(this, AlarmService::class.java).setAction(ACTION_DISMISS),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(alarm.title)
      .setContentText(getString(R.string.willfolks_alarm_ringing, formatStake(alarm.stake)))
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setContentIntent(open)
      // Opens the app over the lock screen; a heads-up banner when the phone is in use.
      .setFullScreenIntent(open, true)
      .addAction(0, getString(R.string.willfolks_alarm_awake), dismiss)
      .build()
  }

  private fun notifyMissed(alarm: StoredAlarm) {
    ensureChannel()
    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(getString(R.string.willfolks_alarm_missed_title))
      .setContentText(getString(R.string.willfolks_alarm_missed_body, alarm.title))
      .setAutoCancel(true)
      .setContentIntent(AlarmScheduler.launchPendingIntent(this))
      .build()
    runCatching {
      (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(NOTIFICATION_MISSED, notification)
    }
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(CHANNEL_ID, getString(R.string.willfolks_alarm_channel), NotificationManager.IMPORTANCE_HIGH).apply {
      description = getString(R.string.willfolks_alarm_channel_description)
      // The service plays the sound itself, on the alarm stream.
      setSound(null, null)
      enableVibration(false)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
  }

  private fun formatStake(stake: Double): String =
    if (stake % 1.0 == 0.0) stake.toLong().toString() else "%.2f".format(stake)

  companion object {
    private const val ACTION_START = "expo.modules.willfolksnative.ALARM_START"
    private const val ACTION_DISMISS = "expo.modules.willfolksnative.ALARM_DISMISS"
    private const val EXTRA_ALARM = "alarm"
    private const val CHANNEL_ID = "willfolks_alarm"
    private const val NOTIFICATION_RINGING = 7401
    private const val NOTIFICATION_MISSED = 7402
    const val RESULT_SUCCESS = "success"
    const val RESULT_FAIL = "fail"

    internal fun start(context: Context, alarm: StoredAlarm) {
      val intent = Intent(context, AlarmService::class.java)
        .setAction(ACTION_START)
        .putExtra(EXTRA_ALARM, alarm.toJson().toString())
      ContextCompat.startForegroundService(context, intent)
    }

    /** Stops the ringing alarm as "awake". Does nothing when no alarm is ringing. */
    internal fun dismiss(context: Context): Boolean {
      if (AlarmStore(context).active == null) return false
      return runCatching {
        context.startService(Intent(context, AlarmService::class.java).setAction(ACTION_DISMISS))
      }.isSuccess
    }
  }
}
