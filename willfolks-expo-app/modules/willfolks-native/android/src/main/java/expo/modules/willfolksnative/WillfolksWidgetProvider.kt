package expo.modules.willfolksnative

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.graphics.Color
import android.widget.RemoteViews

/** Home-screen widget: escrow, streak, active goals and the next alarm. */
class WillfolksWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
    manager.updateAppWidget(appWidgetIds, render(context))
  }

  companion object {
    private const val PREFS = "willfolks_widget"
    private val TEXT_IDS = intArrayOf(
      R.id.widget_title,
      R.id.widget_streak,
      R.id.widget_escrow,
      R.id.widget_unit,
      R.id.widget_goals,
      R.id.widget_alarm
    )

    /** Stores what the widget shows (the app sends ready-to-print, localised strings). */
    fun save(context: Context, data: Map<String, String>) {
      val editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      data.forEach { (key, value) -> editor.putString(key, value) }
      editor.apply()
      refresh(context)
    }

    fun refresh(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, WillfolksWidgetProvider::class.java))
      if (ids.isNotEmpty()) manager.updateAppWidget(ids, render(context))
    }

    private fun render(context: Context): RemoteViews {
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val dark = prefs.getString("theme", "acid") == "void"
      val paper = Color.parseColor(if (dark) "#060a02" else "#c5ff0a")
      val ink = Color.parseColor(if (dark) "#c5ff0a" else "#050702")

      return RemoteViews(context.packageName, R.layout.willfolks_widget).apply {
        setTextViewText(R.id.widget_escrow, prefs.getString("escrow", "0.00"))
        setTextViewText(R.id.widget_streak, prefs.getString("streak", ""))
        setTextViewText(R.id.widget_goals, prefs.getString("goals", ""))
        setTextViewText(R.id.widget_alarm, prefs.getString("alarm", ""))
        setInt(R.id.widget_root, "setBackgroundColor", paper)
        setInt(R.id.widget_rule, "setBackgroundColor", ink)
        TEXT_IDS.forEach { setTextColor(it, ink) }
        setOnClickPendingIntent(R.id.widget_root, AlarmScheduler.launchPendingIntent(context))
      }
    }
  }
}
