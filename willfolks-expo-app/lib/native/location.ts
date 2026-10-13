import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";

import { t } from "@/i18n";
import { Goal, api, setAuthToken } from "@/lib/api";
import { formatClock, isScheduledOn, localDate } from "@/lib/dates";
import { notifyNow } from "@/lib/native/notifications";

const GEOFENCE_TASK = "willfolks-geofence";
// Must match SESSION_TOKEN_KEY in hooks/use-session (importing it here would pull React into the task).
const SESSION_TOKEN_KEY = "wf.session.token.v1";

export type LocationAccess = "none" | "foreground" | "background";

export async function locationAccess(): Promise<LocationAccess> {
  if (!(await Location.getForegroundPermissionsAsync()).granted) return "none";
  return (await Location.getBackgroundPermissionsAsync()).granted ? "background" : "foreground";
}

export async function requestForegroundLocation(): Promise<boolean> {
  return (await Location.requestForegroundPermissionsAsync()).granted;
}

/** Android sends the user to Settings to pick "Allow all the time". */
export async function requestBackgroundLocation(): Promise<boolean> {
  if (!(await requestForegroundLocation())) return false;
  return (await Location.requestBackgroundPermissionsAsync()).granted;
}

export interface Place {
  latitude: number;
  longitude: number;
  label: string;
}

/** Where the device is now, with a street-level label when the geocoder knows one. */
export async function currentPlace(): Promise<Place | null> {
  if (!(await requestForegroundLocation())) return null;
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const fallback = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  let label = fallback;
  try {
    const [address] = await Location.reverseGeocodeAsync(coords);
    label = [address?.name ?? address?.street, address?.city].filter(Boolean).join(", ") || fallback;
  } catch {
    // No geocoder on this device: the coordinates are label enough.
  }
  return { latitude: coords.latitude, longitude: coords.longitude, label: label.slice(0, 120) };
}

/** Checks the user in at a locator goal with the device's current position. */
export async function checkInHere(goal: Goal) {
  if (!(await requestForegroundLocation())) throw new Error(t("native.location.denied"));
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return api.checkin(goal.id, {
    source: "location",
    scheduledFor: localDate(),
    latitude: coords.latitude,
    longitude: coords.longitude,
  });
}

const liveLocatorGoals = (goals: Goal[]) =>
  goals.filter((goal) => goal.kind === "locator" && goal.location && goal.status === "active" && goal.me?.status === "accepted");

/**
 * Registers a geofence per locator goal so arriving checks the user in with the app
 * closed. Needs "Allow all the time"; without it the goal still works by hand.
 */
export async function syncGeofences(goals: Goal[]): Promise<void> {
  const regions = liveLocatorGoals(goals).map((goal) => ({
    // The arrival deadline rides along so the background task needs no network to know it.
    identifier: `${goal.id}|${goal.location!.arriveBy}`,
    latitude: goal.location!.latitude,
    longitude: goal.location!.longitude,
    radius: goal.location!.radiusM,
    notifyOnEnter: true,
    notifyOnExit: false,
  }));
  const running = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
  if (!regions.length || (await locationAccess()) !== "background") {
    if (running) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    return;
  }
  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}

/** Locator goals whose deadline passed today with no check-in are reported as missed. */
export async function reportMissedArrivals(goals: Goal[]): Promise<number> {
  const now = new Date();
  let recorded = 0;
  for (const goal of liveLocatorGoals(goals)) {
    const settledToday = goal.progress.lastCheckin?.scheduledFor === localDate(now);
    if (settledToday || !isScheduledOn(goal, now) || formatClock(now) <= goal.location!.arriveBy) continue;
    try {
      await api.checkin(goal.id, { source: "location", result: "fail", scheduledFor: localDate(now) });
      recorded++;
    } catch {
      // Retried on the next foreground.
    }
  }
  return recorded;
}

// Runs headless when the OS reports a geofence transition, possibly with the app closed.
TaskManager.defineTask<{ eventType: Location.GeofencingEventType; region: Location.LocationRegion }>(
  GEOFENCE_TASK,
  async ({ data, error }) => {
    if (error || data.eventType !== Location.GeofencingEventType.Enter) return;
    const [goalId, arriveBy] = (data.region.identifier ?? "").split("|");
    const now = new Date();
    // Arriving after the deadline proves nothing; the foreground pass reports the miss.
    if (!goalId || !arriveBy || formatClock(now) > arriveBy) return;

    const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    if (!token) return;
    setAuthToken(token);
    try {
      const position = await Location.getLastKnownPositionAsync({ maxAge: 120_000 });
      const { checkin, goal } = await api.checkin(goalId, {
        source: "location",
        scheduledFor: localDate(now),
        latitude: position?.coords.latitude ?? data.region.latitude,
        longitude: position?.coords.longitude ?? data.region.longitude,
      });
      if (checkin.result === "success") await notifyNow(goal.title, t("native.location.arrived"), goal.id);
    } catch {
      // Not a scheduled day, already settled, or offline: the manual check-in remains.
    }
  },
);
