package expo.modules.willfolksnative

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** An alarm goal as the device needs it to ring on its own, without the app running. */
internal data class StoredAlarm(
  val id: String,
  val title: String,
  val hour: Int,
  val minute: Int,
  /** Week days it rings on: 0 = Sunday … 6 = Saturday. */
  val days: List<Int>,
  /** First and last local day (yyyy-MM-dd) the goal is alive. */
  val startDate: String,
  val endDate: String,
  /** How long the user has to react before the check counts as failed. */
  val reactionSeconds: Int,
  val vibrate: Boolean,
  val stake: Double,
  /** Test alarms ring once and leave no result behind. */
  val test: Boolean = false
) {
  fun toJson(): JSONObject = JSONObject()
    .put("id", id)
    .put("title", title)
    .put("hour", hour)
    .put("minute", minute)
    .put("days", JSONArray(days))
    .put("startDate", startDate)
    .put("endDate", endDate)
    .put("reactionSeconds", reactionSeconds)
    .put("vibrate", vibrate)
    .put("stake", stake)
    .put("test", test)

  companion object {
    fun fromJson(json: JSONObject): StoredAlarm {
      val days = json.getJSONArray("days")
      return StoredAlarm(
        id = json.getString("id"),
        title = json.getString("title"),
        hour = json.getInt("hour"),
        minute = json.getInt("minute"),
        days = List(days.length()) { days.getInt(it) },
        startDate = json.getString("startDate"),
        endDate = json.getString("endDate"),
        reactionSeconds = json.getInt("reactionSeconds"),
        vibrate = json.getBoolean("vibrate"),
        stake = json.getDouble("stake"),
        test = json.optBoolean("test", false)
      )
    }
  }
}

/** The alarm that is ringing right now. */
internal data class ActiveAlarm(val alarm: StoredAlarm, val firedAt: Long, val scheduledFor: String) {
  fun toJson(): JSONObject = JSONObject()
    .put("alarm", alarm.toJson())
    .put("firedAt", firedAt)
    .put("scheduledFor", scheduledFor)

  fun toMap(): Map<String, Any?> = mapOf(
    "id" to alarm.id,
    "title" to alarm.title,
    "time" to "%02d:%02d".format(alarm.hour, alarm.minute),
    "stake" to alarm.stake,
    "reactionSeconds" to alarm.reactionSeconds,
    "firedAt" to firedAt.toDouble(),
    "scheduledFor" to scheduledFor,
    "test" to alarm.test
  )

  companion object {
    fun fromJson(json: JSONObject) =
      ActiveAlarm(StoredAlarm.fromJson(json.getJSONObject("alarm")), json.getLong("firedAt"), json.getString("scheduledFor"))
  }
}

/** How an alarm ended, kept until the app has reported it to the backend. */
internal data class AlarmResult(
  val id: String,
  val scheduledFor: String,
  /** "success" when dismissed in time, "fail" when it rang out. */
  val result: String,
  val reactionSeconds: Int
) {
  val key get() = "$id|$scheduledFor"

  fun toJson(): JSONObject = JSONObject()
    .put("id", id)
    .put("scheduledFor", scheduledFor)
    .put("result", result)
    .put("reactionSeconds", reactionSeconds)

  fun toMap(): Map<String, Any?> = mapOf(
    "key" to key,
    "id" to id,
    "scheduledFor" to scheduledFor,
    "result" to result,
    "reactionSeconds" to reactionSeconds
  )

  companion object {
    fun fromJson(json: JSONObject) =
      AlarmResult(json.getString("id"), json.getString("scheduledFor"), json.getString("result"), json.getInt("reactionSeconds"))
  }
}

/** Alarm state that has to outlive the app process, the JS runtime and a reboot. */
internal class AlarmStore(context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences("willfolks_alarms", Context.MODE_PRIVATE)

  fun alarms(): List<StoredAlarm> = synchronized(LOCK) { readArray(KEY_ALARMS).map(StoredAlarm::fromJson) }

  fun find(id: String): StoredAlarm? = alarms().firstOrNull { it.id == id }

  fun replace(alarms: List<StoredAlarm>) = synchronized(LOCK) { writeArray(KEY_ALARMS, alarms.map { it.toJson() }) }

  fun put(alarm: StoredAlarm) = replace(alarms().filter { it.id != alarm.id } + alarm)

  fun remove(id: String) = replace(alarms().filter { it.id != id })

  var active: ActiveAlarm?
    get() = synchronized(LOCK) {
      prefs.getString(KEY_ACTIVE, null)?.let { runCatching { ActiveAlarm.fromJson(JSONObject(it)) }.getOrNull() }
    }
    set(value) = synchronized(LOCK) {
      prefs.edit().apply { if (value == null) remove(KEY_ACTIVE) else putString(KEY_ACTIVE, value.toJson().toString()) }.commit()
      Unit
    }

  fun results(): List<AlarmResult> = synchronized(LOCK) { readArray(KEY_RESULTS).map(AlarmResult::fromJson) }

  /** One result per alarm and day: the first verdict stands. */
  fun addResult(result: AlarmResult) = synchronized(LOCK) {
    val current = readArray(KEY_RESULTS).map(AlarmResult::fromJson)
    if (current.none { it.key == result.key }) writeArray(KEY_RESULTS, (current + result).map { it.toJson() })
  }

  fun acknowledge(keys: List<String>) = synchronized(LOCK) {
    writeArray(KEY_RESULTS, readArray(KEY_RESULTS).map(AlarmResult::fromJson).filter { it.key !in keys }.map { it.toJson() })
  }

  private fun readArray(key: String): List<JSONObject> {
    val raw = prefs.getString(key, null) ?: return emptyList()
    return runCatching { JSONArray(raw).let { array -> List(array.length()) { array.getJSONObject(it) } } }.getOrDefault(emptyList())
  }

  private fun writeArray(key: String, items: List<JSONObject>) {
    prefs.edit().putString(key, JSONArray(items).toString()).commit()
  }

  private companion object {
    val LOCK = Any()
    const val KEY_ALARMS = "alarms"
    const val KEY_ACTIVE = "active"
    const val KEY_RESULTS = "results"
  }
}
