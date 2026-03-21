import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

import { Card } from "@/components/ui/card";

export default function SettingsScreen() {
  const router = useRouter();
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [alarmNotifications, setAlarmNotifications] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showSecondsInTime, setShowSecondsInTime] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        <Card>
          <Text style={styles.sectionTitle}>Experience</Text>
          <SettingRow
            icon="vibration"
            label="Haptic feedback"
            description="Use vibration feedback when interacting with tabs and actions."
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
          />
          <SettingRow
            icon="timer"
            label="Show seconds in clock"
            description="Display seconds in the Time tab live clock."
            value={showSecondsInTime}
            onValueChange={setShowSecondsInTime}
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Alarm & focus</Text>
          <SettingRow
            icon="notifications-active"
            label="Alarm reminders"
            description="Enable modal alerts when an alarm activity is triggered."
            value={alarmNotifications}
            onValueChange={setAlarmNotifications}
          />
          <SettingRow
            icon="graphic-eq"
            label="Alarm vibration"
            description="Allow repeated vibration while alarm is active."
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
          />
        </Card>

        <Card>
          <Pressable
            style={styles.accountLink}
            onPress={() => router.push("/(tabs)/account")}
          >
            <View style={styles.accountIcon}>
              <MaterialIcons name="person" size={20} color="#111111" />
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountTitle}>Open account profile</Text>
              <Text style={styles.accountDescription}>
                Go to account details and personal information.
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color="rgba(17,17,17,0.6)"
            />
          </Pressable>
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
});
