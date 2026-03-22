import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

import { Card } from "@/components/ui/card";
import { useWalletSecurity } from "@/hooks/use-wallet-security";
import { t } from "@/i18n";

export default function SettingsScreen() {
  const router = useRouter();
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [alarmNotifications, setAlarmNotifications] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showSecondsInTime, setShowSecondsInTime] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("settings.title")}</Text>

        <Card>
          <Text style={styles.sectionTitle}>{t("settings.experience")}</Text>
          <SettingRow
            icon="vibration"
            label={t("settings.hapticFeedback")}
            description={t("settings.hapticFeedbackDesc")}
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
          />
          <SettingRow
            icon="timer"
            label={t("settings.showSeconds")}
            description={t("settings.showSecondsDesc")}
            value={showSecondsInTime}
            onValueChange={setShowSecondsInTime}
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>{t("settings.alarmFocus")}</Text>
          <SettingRow
            icon="notifications-active"
            label={t("settings.alarmReminders")}
            description={t("settings.alarmRemindersDesc")}
            value={alarmNotifications}
            onValueChange={setAlarmNotifications}
          />
          <SettingRow
            icon="graphic-eq"
            label={t("settings.alarmVibration")}
            description={t("settings.alarmVibrationDesc")}
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
          />
        </Card>

        <Card>
          <Pressable
            style={styles.accountLink}
            onPress={() => router.push("/account")}
          >
            <View style={styles.accountIcon}>
              <MaterialIcons name="person" size={20} color="#111111" />
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountTitle}>
                {t("settings.openAccount")}
              </Text>
              <Text style={styles.accountDescription}>
                {t("settings.openAccountDesc")}
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color="rgba(17,17,17,0.6)"
            />
          </Pressable>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>{t("settings.wallet")}</Text>
          <View style={styles.walletItem}>
            <Text style={styles.walletLabel}>{t("settings.address")}</Text>
            <Text selectable style={styles.walletValue}>
              {wallet?.address ?? t("settings.generatingWallet")}
            </Text>
          </View>

          {initializationError ? (
            <Text style={styles.walletError}>{initializationError}</Text>
          ) : null}

          {!sensitiveUnlocked ? (
            <View style={styles.sensitiveLockBox}>
              <Text style={styles.lockedTitle}>
                {t("settings.hiddenSensitiveTitle")}
              </Text>
              <Text style={styles.lockedDescription}>
                {t("settings.hiddenSensitiveDesc")}
              </Text>
              {biometricError ? (
                <Text style={styles.walletError}>{biometricError}</Text>
              ) : null}
              <Pressable
                style={[
                  styles.unlockButton,
                  (isAuthenticating || !biometricAvailable) &&
                    styles.unlockButtonDisabled,
                ]}
                onPress={handleUnlockSensitiveData}
                disabled={isAuthenticating || !biometricAvailable}
              >
                {isAuthenticating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.unlockButtonText}>
                    {t("settings.unlockWithBiometric")}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.walletItem}>
                <Text style={styles.walletLabel}>
                  {t("settings.privateKey")}
                </Text>
                <Text selectable style={styles.walletValue}>
                  {wallet?.privateKey}
                </Text>
              </View>
              <View style={styles.walletItem}>
                <Text style={styles.walletLabel}>{t("settings.mnemonic")}</Text>
                <Text selectable style={styles.walletValue}>
                  {wallet?.mnemonic}
                </Text>
              </View>

              <Pressable style={styles.lockButton} onPress={lockSensitiveData}>
                <Text style={styles.lockButtonText}>
                  {t("settings.hideSensitiveData")}
                </Text>
              </Pressable>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingRowProps {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function SettingRow({
  icon,
  label,
  description,
  value,
  onValueChange,
}: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <MaterialIcons name={icon} size={19} color="#111111" />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "rgba(17,17,17,0.14)", true: "#111111" }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(17,17,17,0.6)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(17,17,17,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  settingDescription: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(17,17,17,0.6)",
  },
  accountLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(17,17,17,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  accountText: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  accountDescription: {
    marginTop: 2,
    fontSize: 13,
    color: "rgba(17,17,17,0.6)",
  },
  walletItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(17,17,17,0.08)",
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(17,17,17,0.6)",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  walletValue: {
    fontSize: 13,
    color: "#111111",
    lineHeight: 19,
  },
  sensitiveLockBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(17,17,17,0.08)",
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  lockedDescription: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(17,17,17,0.6)",
  },
  unlockButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  unlockButtonDisabled: {
    opacity: 0.45,
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  lockButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },
  walletError: {
    marginTop: 8,
    fontSize: 13,
    color: "#111111",
  },
});
