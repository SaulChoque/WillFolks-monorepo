import * as ImagePicker from "expo-image-picker";

const PHOTO: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.6 };

/** Opens the camera or the gallery for a square photo and resolves to the picked file, if any. */
export async function pickPhoto(source: "camera" | "gallery"): Promise<string | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
  }
  const result =
    source === "camera" ? await ImagePicker.launchCameraAsync(PHOTO) : await ImagePicker.launchImageLibraryAsync(PHOTO);
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}
