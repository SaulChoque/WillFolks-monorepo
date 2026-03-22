import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

import { DaySelector } from "@/components/activity/day-selector";
import { Card } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { activitiesMock } from "@/constants/mock-data";
import { AppColors } from "@/constants/theme";
import { t } from "@/i18n";
import { HomeActivity } from "@/types/home";

export default function ActivityDetailScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();

  const activity = useMemo<HomeActivity | undefined>(
    () => activitiesMock.find((item) => item.id === activityId),
    [activityId],
  );

  const [enabled, setEnabled] = useState(activity?.isActive ?? false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    activity?.notificationsEnabled ?? false,
  );

  if (!activity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>{t("activity.notFound")}</Text>
      </SafeAreaView>
    );
  }

  const handleNavigateToFocus = () => {
    router.push(`/focus/${activity.id}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: activity.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.subtitle}>{activity.repeatLabel}</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{
                false: AppColors.lilac.switchOff,
                true: AppColors.lilac.switchOn,
              }}
              thumbColor="#ffffff"
            />
          </View>
          <Text style={[styles.timeLabel, styles.sectionSpacing]}>
            {activity.summaryLabel}
          </Text>
          <View style={styles.sectionSpacing}>
            <DaySelector days={activity.days} />
          </View>
          <View style={[styles.toggleRow, styles.sectionSpacingLarge]}>
            <Text style={styles.toggleLabel}>
              {t("activity.notifications")}
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{
                false: AppColors.lilac.switchOff,
                true: AppColors.lilac.switchOn,
              }}
              thumbColor="#ffffff"
            />
          </View>
          <View style={[styles.secondaryRow, styles.sectionSpacingLarge]}>
            <View style={[styles.secondaryItem, styles.secondaryItemSpacing]}>
              <MaterialIcons
                name="payments"
                size={22}
                color={AppColors.lilac.iconStrong}
              />
              <Text style={styles.secondaryLabel}>{t("activity.amount")}</Text>
              <Text style={styles.secondaryValue}>{activity.amountLabel}</Text>
            </View>
            <View style={styles.secondaryItem}>
              <MaterialIcons
                name="cancel"
                size={22}
                color={AppColors.lilac.iconStrong}
              />
              <Text style={styles.secondaryLabel}>{t("activity.cancel")}</Text>
              <Text style={styles.secondaryValue}>
                {t("activity.noRepeat")}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
      <FloatingActionButton style={styles.fab} onPress={handleNavigateToFocus}>
        <MaterialIcons
          name="play-arrow"
          size={30}
          color={AppColors.lilac.iconStrong}
        />
      </FloatingActionButton>
    </SafeAreaView>
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
  },
  errorText: {
    marginTop: 48,
    textAlign: "center",
    fontSize: 16,
    color: AppColors.lilac.textPrimary,
  },
  card: {},
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: AppColors.lilac.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: AppColors.lilac.textSecondary,
  },
  timeLabel: {
    fontSize: 32,
    fontWeight: "700",
    color: AppColors.lilac.textPrimary,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.lilac.textPrimary,
  },
  secondaryRow: {
    flexDirection: "row",
  },
  secondaryItem: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: AppColors.lilac.chip,
    borderWidth: 1,
    borderColor: AppColors.lilac.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  secondaryItemSpacing: {
    marginRight: 12,
  },
  secondaryLabel: {
    marginTop: 8,
    fontSize: 14,
    color: AppColors.lilac.textSecondary,
  },
  secondaryValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.lilac.textPrimary,
  },
  sectionSpacing: {
    marginTop: 18,
  },
  sectionSpacingLarge: {
    marginTop: 24,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 48,
  },
});
