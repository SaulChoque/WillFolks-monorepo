import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Field, Notice, T } from "@/components/pixel/ui";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";
import { localDate } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";

/** Camera screen for AI goals: shoot (or pick) the proof, add a note, send it to the judge. */
export default function ProofScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const insets = useSafeAreaInsets();
  const { state, actions } = useAppStore();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const goal = state.goals.find((item) => item.id === activityId);
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"approved" | "pending" | "rejected" | null>(null);

  const shoot = async () => {
    setError(null);
    try {
      const picture = await camera.current?.takePictureAsync({ quality: 0.6 });
      if (picture?.uri) setPhoto(picture.uri);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const send = async () => {
    if (!photo || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { proof } = await actions.submitProof(activityId, photo, { note: note.trim() || undefined, scheduledFor: localDate() });
      setVerdict(proof.status);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const frame = {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: insets.top + theme.em(0.6),
    paddingBottom: Math.max(insets.bottom, theme.em(0.6)) + theme.em(0.3),
    paddingHorizontal: theme.em(0.8),
    gap: theme.em(0.6),
  };
  const header = (
    <View style={{ gap: theme.em(0.2) }}>
      <T v="label">{t("detail.sendProof")}</T>
      <T v="h1sm" numberOfLines={1}>
        {goal?.title ?? ""}
      </T>
      {goal?.ai ? <T v="say" numberOfLines={3}>{`> ${goal.ai.prompt}`}</T> : null}
    </View>
  );

  if (verdict) {
    return (
      <View style={[frame, { justifyContent: "center" }]}>
        <T v="h1" testID="proof-verdict">
          {t(`proofScreen.verdict.${verdict}.title`)}
        </T>
        <T v="say">{`> ${t(`proofScreen.verdict.${verdict}.body`)}`}</T>
        <Btn testID="proof-done" label={t("common.done")} icon="check" size="xl" onPress={() => router.back()} />
      </View>
    );
  }

  if (photo) {
    return (
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={frame}>
        {header}
        <Image source={{ uri: photo }} style={{ flex: 1, borderWidth: theme.line, borderColor: theme.fg }} contentFit="cover" />
        <Field testID="proof-note" label={t("proofScreen.note")} value={note} onChangeText={setNote} maxLength={500} />
        {error ? <Notice>{error}</Notice> : null}
        <View style={{ flexDirection: "row", gap: theme.em(0.45) }}>
          <Btn label={t("proofScreen.retake")} variant="line" style={{ flex: 1 }} disabled={busy} onPress={() => setPhoto(null)} />
          <Btn testID="proof-send" label={busy ? t("common.working") : t("proofScreen.send")} icon="arrow" style={{ flex: 1 }} disabled={busy} onPress={send} />
        </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={frame}>
      {header}
      {permission?.granted ? (
        <View style={{ flex: 1, borderWidth: theme.line, borderColor: theme.fg, overflow: "hidden" }}>
          <CameraView ref={camera} style={{ flex: 1 }} facing="back" onCameraReady={() => setReady(true)} />
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: "center", gap: theme.em(0.6) }}>
          <Notice tone="info">{t("perms.items.camera.body")}</Notice>
          <Btn testID="proof-allow-camera" label={t("perms.allow")} icon="eye" onPress={requestPermission} />
        </View>
      )}
      {error ? <Notice>{error}</Notice> : null}
      <View style={{ flexDirection: "row", gap: theme.em(0.45) }}>
        <Btn label={t("common.cancel")} variant="line" style={{ flex: 1 }} onPress={() => router.back()} />
        <Btn testID="proof-gallery" label={t("ob.profile.gallery")} icon="grid" variant="line" style={{ flex: 1 }} onPress={pick} />
      </View>
      <Btn
        testID="proof-shoot"
        label={t("proofScreen.shoot")}
        icon="eye"
        size="xl"
        disabled={!permission?.granted || !ready}
        style={!permission?.granted || !ready ? { opacity: 0.45 } : undefined}
        onPress={shoot}
      />
    </View>
  );
}
