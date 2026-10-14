import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Avatar } from "@/components/pixel/avatar";
import { Btn, Field, Notice } from "@/components/pixel/ui";
import { OnboardingFrame } from "@/components/system/onboarding-frame";
import { usePixelTheme } from "@/hooks/use-app-store";
import { useSession } from "@/hooks/use-session";
import { t } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { pickPhoto } from "@/lib/native/photos";

const USERNAME = /^[a-zA-Z0-9_]{3,24}$/;

export default function ProfileSetupScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { user, updateProfile, uploadAvatar } = useSession();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = displayName.trim().length > 0 && USERNAME.test(username);

  const choose = async (source: "camera" | "gallery") => {
    try {
      const uri = await pickPhoto(source);
      if (uri) setPhoto(uri);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ displayName: displayName.trim(), username });
      if (photo) await uploadAvatar(photo);
      router.push("/onboarding/permissions");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingFrame
      step={2}
      title={t("ob.profile.title")}
      lead={t("ob.profile.lead")}
      footer={
        <Btn
          testID="profile-submit"
          label={busy ? t("common.working") : t("common.continue")}
          icon="arrow"
          size="xl"
          disabled={!valid || busy}
          style={!valid || busy ? { opacity: 0.45 } : undefined}
          onPress={submit}
        />
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.6) }}>
        <Avatar name={displayName} uri={photo ?? user?.avatarUrl} size={3.6} />
        <View style={{ flex: 1, gap: theme.em(0.35) }}>
          <Btn testID="profile-camera" label={t("ob.profile.camera")} icon="eye" size="sm" variant="line" onPress={() => choose("camera")} />
          <Btn testID="profile-gallery" label={t("ob.profile.gallery")} icon="grid" size="sm" variant="line" onPress={() => choose("gallery")} />
        </View>
      </View>
      <Field
        testID="profile-name"
        label={t("ob.profile.displayName")}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={60}
        returnKeyType="next"
      />
      <Field
        testID="profile-username"
        label={t("ob.profile.username")}
        hint={t("ob.profile.usernameHint")}
        value={username}
        onChangeText={(value) => setUsername(value.replace(/[^a-zA-Z0-9_]/g, ""))}
        maxLength={24}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {error ? <Notice>{error}</Notice> : null}
    </OnboardingFrame>
  );
}
