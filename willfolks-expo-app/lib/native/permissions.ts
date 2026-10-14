import { Camera } from "expo-camera";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { api } from "@/lib/api";
import { LocationAccess, locationAccess } from "@/lib/native/location";
import { notificationsGranted } from "@/lib/native/notifications";
import { WillfolksNative } from "@/modules/willfolks-native";

export interface Permissions {
  notifications: boolean;
  exactAlarms: boolean;
  fullScreenAlarm: boolean;
  usageAccess: boolean;
  location: LocationAccess;
  camera: boolean;
}

export async function readPermissions(): Promise<Permissions> {
  const [notifications, location, camera] = await Promise.all([
    notificationsGranted(),
    locationAccess(),
    Camera.getCameraPermissionsAsync().then((permission) => permission.granted),
  ]);
  return {
    notifications,
    location,
    camera,
    exactAlarms: WillfolksNative?.canScheduleExactAlarms() ?? false,
    fullScreenAlarm: WillfolksNative?.canUseFullScreenIntent() ?? false,
    usageAccess: WillfolksNative?.hasUsageAccess() ?? false,
  };
}

export async function requestCamera(): Promise<boolean> {
  return (await Camera.requestCameraPermissionsAsync()).granted;
}

const INSTALL_ID_KEY = "wf.install.v1";

async function installId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTALL_ID_KEY);
  if (existing) return existing;
  const created = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  await SecureStore.setItemAsync(INSTALL_ID_KEY, created);
  return created;
}

/** Tells the backend which device this is and what it is allowed to measure. */
export async function reportDevice(): Promise<void> {
  const permissions = await readPermissions();
  const constants = Platform.constants as { Model?: string; Release?: string };
  await api.reportDevice({
    installId: await installId(),
    platform: Platform.OS === "ios" ? "ios" : Platform.OS === "web" ? "web" : "android",
    model: constants.Model,
    osVersion: constants.Release ?? String(Platform.Version),
    notificationsGranted: permissions.notifications,
    exactAlarmGranted: permissions.exactAlarms,
    usageAccessGranted: permissions.usageAccess,
    cameraGranted: permissions.camera,
    locationAccess: permissions.location,
  });
}
