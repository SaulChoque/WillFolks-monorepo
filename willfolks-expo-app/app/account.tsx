import { useState } from "react";
import { Alert, View } from "react-native";

import { Avatar } from "@/components/pixel/avatar";
import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Chip, Field, Notice, SectionTitle, T } from "@/components/pixel/ui";
import type { PixelIconName } from "@/constants/pixel-icons";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useApi } from "@/hooks/use-api";
import { useSession } from "@/hooks/use-session";
import { getDeviceLocaleTag, t } from "@/i18n";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { pickPhoto } from "@/lib/native/photos";

const USERNAME = /^[a-zA-Z0-9_]{3,24}$/;

export default function AccountScreen() {
  const theme = usePixelTheme();
  const { state } = useAppStore();
  const { user, updateProfile, uploadAvatar, signOut, deleteAccount } = useSession();
  const friends = useApi(api.friends);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [location, setLocation] = useState(user?.locationLabel ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  if (!user) return null;

  const dirty = displayName.trim() !== user.displayName || username !== (user.username ?? "") || location.trim() !== (user.locationLabel ?? "");
  const valid = displayName.trim().length > 0 && USERNAME.test(username);
  const achieved = state.goals.reduce((total, goal) => total + goal.progress.successCount, 0);

  const run = async (action: () => Promise<unknown>, done?: string) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await action();
      if (done) setMessage({ tone: "info", text: done });
    } catch (failure) {
      setMessage({ tone: "error", text: errorMessage(failure) });
    } finally {
      setBusy(false);
    }
  };

  const changePhoto = (source: "camera" | "gallery") =>
    run(async () => {
      const uri = await pickPhoto(source);
      if (uri) await uploadAvatar(uri);
    });

  const confirmDelete = () =>
    Alert.alert(t("account.deleteAccount"), t("account.deleteBody"), [
      { text: t("common.no"), style: "cancel" },
      { text: t("account.deleteConfirm"), style: "destructive", onPress: () => run(deleteAccount) },
    ]);

  return (
    <Screen>
      <SectionTitle>{t("account.title")}</SectionTitle>

      <Card contentStyle={{ gap: theme.em(0.6) }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.6) }}>
          <Avatar name={user.displayName} uri={user.avatarUrl} size={3.6} />
          <View style={{ flex: 1, gap: theme.em(0.35) }}>
            <Btn testID="account-camera" label={t("ob.profile.camera")} icon="eye" size="sm" variant="line" disabled={busy} onPress={() => changePhoto("camera")} />
            <Btn testID="account-gallery" label={t("ob.profile.gallery")} icon="grid" size="sm" variant="line" disabled={busy} onPress={() => changePhoto("gallery")} />
          </View>
        </View>
        <Field testID="account-name" label={t("ob.profile.displayName")} value={displayName} onChangeText={setDisplayName} maxLength={60} />
        <Field
          testID="account-username"
          label={t("ob.profile.username")}
          value={username}
          onChangeText={(value) => setUsername(value.replace(/[^a-zA-Z0-9_]/g, ""))}
          maxLength={24}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Field testID="account-location" label={t("account.location")} value={location} onChangeText={setLocation} maxLength={120} />
        <T v="note">{user.email}</T>
        <Btn
          testID="account-save"
          label={busy ? t("common.working") : t("common.save")}
          icon="check"
          disabled={busy || !dirty || !valid}
          style={busy || !dirty || !valid ? { opacity: 0.45 } : undefined}
          onPress={() =>
            run(() => updateProfile({ displayName: displayName.trim(), username, locationLabel: location.trim() }), t("account.saved"))
          }
        />
      </Card>

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <Card contentStyle={{ gap: theme.em(0.7) }}>
        <DetailRow
          icon="calendar"
          label={t("account.dateOfInvitation")}
          value={new Date(user.createdAt).toLocaleDateString(getDeviceLocaleTag(), { day: "numeric", month: "short", year: "numeric" })}
        />
        <DetailRow icon="grid" label={t("account.chain")} value={user.chain} />
        <DetailRow icon="group" label={t("account.numberOfFriends")} value={String(friends.data?.friends.length ?? 0)} />
        <DetailRow icon="check" label={t("account.goalsAchieved")} value={String(achieved)} />
        <DetailRow icon="flame" label={t("account.streak")} value={t("pixel.pet.days", { count: state.pet.streak })} />
        <DetailRow icon="coin" label={t("pixel.home.inEscrow")} value={`${state.balance.inEscrow.toFixed(2)} USDC`} />
      </Card>

      <Btn testID="account-signout" label={t("account.signOut")} icon="arrow" variant="line" disabled={busy} onPress={() => run(signOut)} />
      <Btn testID="account-delete" label={t("account.deleteAccount")} icon="close" variant="line" disabled={busy} onPress={confirmDelete} />
    </Screen>
  );
}

interface DetailRowProps {
  icon: PixelIconName;
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  const theme = usePixelTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
      <Chip icon={icon} />
      <T v="label" style={{ flex: 1 }}>
        {label}
      </T>
      <T v="value">{value}</T>
    </View>
  );
}
