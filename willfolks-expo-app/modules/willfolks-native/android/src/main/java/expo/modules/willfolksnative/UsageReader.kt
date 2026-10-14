package expo.modules.willfolksnative

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process

/** Reads per-app screen time from UsageStatsManager (needs the user's "Usage access" grant). */
internal object UsageReader {
  fun hasAccess(context: Context): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  /**
   * Foreground time per package between [start] and [end], in milliseconds.
   * Built from resume/pause events rather than the daily buckets of queryUsageStats,
   * which spill over the edges of the requested range.
   */
  fun foregroundMillis(context: Context, start: Long, end: Long): Map<String, Long> {
    val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = manager.queryEvents(start, end) ?: return emptyMap()
    val totals = HashMap<String, Long>()
    val resumedAt = HashMap<String, Long>()
    val seen = HashSet<String>()
    val event = UsageEvents.Event()

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val pkg = event.packageName ?: continue
      when (event.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> resumedAt.putIfAbsent(pkg, event.timeStamp)
        UsageEvents.Event.ACTIVITY_PAUSED -> {
          // A pause with no resume in range means the app was already open at `start`.
          val since = resumedAt.remove(pkg) ?: if (pkg in seen) null else start
          if (since != null) totals[pkg] = (totals[pkg] ?: 0L) + (event.timeStamp - since)
        }
        else -> continue
      }
      seen.add(pkg)
    }

    // Whatever is still on screen counts up to the end of the range.
    val until = minOf(end, System.currentTimeMillis())
    resumedAt.forEach { (pkg, since) -> if (until > since) totals[pkg] = (totals[pkg] ?: 0L) + (until - since) }
    return totals
  }

  fun label(context: Context, packageName: String): String = runCatching {
    val pm = context.packageManager
    pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
  }.getOrDefault(packageName)

  /** Apps with a launcher icon, i.e. the ones a person would recognise and want to limit. */
  fun launchableApps(context: Context): List<Map<String, String>> {
    val pm = context.packageManager
    val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    return pm.queryIntentActivities(launcher, 0)
      .map { it.activityInfo.packageName to it.loadLabel(pm).toString() }
      .filter { (pkg, _) -> pkg != context.packageName }
      .distinctBy { it.first }
      .sortedBy { it.second.lowercase() }
      .map { (pkg, name) -> mapOf("packageName" to pkg, "appName" to name) }
  }
}
