import { Href, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { PixelIcon } from "@/components/pixel/pixel-icon";
import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Chip, Main, SectionTitle, T, Toggle, useHaptic } from "@/components/pixel/ui";
import type { PixelIconName } from "@/constants/pixel-icons";
import type { ThemeId } from "@/constants/theme";
import { SettingKey, useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useWalletSecurity } from "@/hooks/use-wallet-security";
import { t } from "@/i18n";

const SETTING_GROUPS: { title: string; items: { key: SettingKey; icon: PixelIconName }[] }[] = [
  {
    title: "experience",
    items: [
      { key: "haptics", icon: "vibrate" },
      { key: "seconds", icon: "hourglass" },
    ],
  },
  {
    title: "alarmFocus",
    items: [
      { key: "reminders", icon: "bell" },
      { key: "vibration", icon: "bolt" },
    ],
  },
];

const LINKS: { id: string; icon: PixelIconName; href: Href }[] = [
  { id: "account", icon: "user", href: "/account" },
  { id: "wallet", icon: "wallet", href: "/wallet" },
  { id: "friends", icon: "group", href: "/friends" },
  { id: "permissions", icon: "lock", href: "/permissions" },
];

const THEMES: ThemeId[] = ["acid", "void"];
const HOLD_MS = 900;

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(20, 24)}…${address.slice(-4)}`;
}

function Secret({ label, value }: { label: string; value?: string }) {
  const theme = usePixelTheme();
  return (
    <View style={{ gap: theme.em(0.15), paddingTop: theme.em(0.4), borderTopWidth: theme.line, borderColor: theme.fg }}>
      <T v="label">{label}</T>
      <T v="mono" selectable>
        {value}
      </T>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const haptic = useHaptic();
  const { state, actions } = useAppStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const fill = useSharedValue(0);

  const {
    wallet,
    sensitiveUnlocked,
    biometricAvailable,
    biometricError,
    initializationError,
    authenticateToReveal,
    lockSensitiveData,
  } = useWalletSecurity();

  const handleUnlockSensitiveData = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await authenticateToReveal();
    } finally {
      setIsAuthenticating(false);
      fill.value = 0;
    }
  };

  // Hold-to-unlock: the bar fills while pressed and snaps back on release.
  const startHold = () => {
    fill.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(handleUnlockSensitiveData)();
    });
  };
  const cancelHold = () => {
    if (isAuthenticating) return;
    fill.value = withTiming(0, { duration: 200 });
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const unlockDisabled = isAuthenticating || !biometricAvailable;

  return (
    <Screen>
      <SectionTitle>{t("pixel.settings.title")}</SectionTitle>

      <Card>
        <T v="label">{t("pixel.settings.display")}</T>
        <View accessibilityRole="radiogroup" style={{ flexDirection: "row", borderWidth: theme.line, borderColor: theme.fg }}>
          {THEMES.map((id) => {
            const selected = state.theme === id;
            return (
              <Pressable
                key={id}
                testID={`theme-${id}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  haptic();
                  actions.setTheme(id);
                }}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: theme.em(0.5),
                  backgroundColor: selected ? theme.fg : "transparent",
                }}
              >
                <T v="button" color={selected ? theme.bg : theme.fg}>
                  {t(`pixel.settings.theme.${id}`)}
                </T>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {SETTING_GROUPS.map((group) => (
        <Card key={group.title}>
          <T v="label">{t(`pixel.settings.${group.title}`)}</T>
          {group.items.map(({ key, icon }) => (
            <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
              <Chip icon={icon} />
              <Main
                title={t(`pixel.settings.items.${key}.title`)}
                note={t(`pixel.settings.items.${key}.body`)}
              />
              <Toggle
                checked={state.settings[key]}
                label={t(`pixel.settings.items.${key}.title`)}
                onChange={() => actions.toggleSetting(key)}
              />
            </View>
          ))}
        </Card>
      ))}

      <Card contentStyle={{ gap: theme.em(0.7) }}>
        {LINKS.map((link) => (
          <Pressable
            key={link.id}
            testID={`settings-${link.id}`}
            accessibilityRole="button"
            onPress={() => {
              haptic();
              router.push(link.href);
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}
          >
            <Chip icon={link.icon} />
            <Main title={t(`pixel.settings.links.${link.id}.title`)} note={t(`pixel.settings.links.${link.id}.body`)} />
            <PixelIcon name="arrow" size={theme.em(1)} color={theme.fg} />
          </Pressable>
        ))}
      </Card>

      <Card>
        <T v="label">{t("pixel.settings.wallet")}</T>
        <T v="mono" selectable>
          {wallet ? shortAddress(wallet.address) : t("pixel.settings.walletKeys.generating")}
        </T>
        {initializationError ? <T v="note">{initializationError}</T> : null}

        {sensitiveUnlocked ? (
          <>
            <Main
              title={t("pixel.settings.walletKeys.unlockedTitle")}
              note={t("pixel.settings.walletKeys.unlockedBody")}
            />
            <Secret label={t("pixel.settings.walletKeys.address")} value={wallet?.address} />
            <Secret label={t("pixel.settings.walletKeys.privateKey")} value={wallet?.privateKey} />
            <Secret label={t("pixel.settings.walletKeys.mnemonic")} value={wallet?.mnemonic} />
            <Btn
              label={t("pixel.settings.walletKeys.hide")}
              icon="lock"
              variant="line"
              onPress={lockSensitiveData}
            />
          </>
        ) : (
          <>
            <Main title={t("pixel.settings.hiddenTitle")} note={t("pixel.settings.hiddenBody")} />
            {biometricError ? <T v="note">{biometricError}</T> : null}
            <Btn
              label={t("pixel.settings.unlock")}
              icon="lock"
              disabled={unlockDisabled}
              style={unlockDisabled ? { opacity: 0.45 } : undefined}
              onPressIn={startHold}
              onPressOut={cancelHold}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: theme.bg, opacity: 0.4 },
                  fillStyle,
                ]}
              />
            </Btn>
          </>
        )}
      </Card>
    </Screen>
  );
}
