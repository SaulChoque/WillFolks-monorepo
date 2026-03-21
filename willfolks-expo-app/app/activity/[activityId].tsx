import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ActivityMetricList } from '@/components/activity/activity-metric-list';
import { DaySelector } from '@/components/activity/day-selector';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { Card } from '@/components/ui/card';
import { detailMetricsByActivity, homeActivities } from '@/constants/mock-data';
import { HomeActivity } from '@/types/home';

export default function ActivityDetailScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();

  const activity = useMemo<HomeActivity | undefined>(
    () => homeActivities.find((item) => item.id === activityId),
    [activityId],
  );

  const metrics = activity ? detailMetricsByActivity[activity.id] ?? [] : [];
  const [enabled, setEnabled] = useState(activity?.isActive ?? false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(activity?.notificationsEnabled ?? false);

  if (!activity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Activity not found.</Text>
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
              trackColor={{ false: 'rgba(17,17,17,0.12)', true: '#111111' }}
              thumbColor="#ffffff"
            />
          </View>
          <Text style={[styles.timeLabel, styles.sectionSpacing]}>{activity.summaryTimeLabel}</Text>
          <View style={styles.sectionSpacing}>
            <DaySelector days={activity.days} />
          </View>
          <View style={styles.sectionSpacingLarge}>
            <ActivityMetricList metrics={metrics} />
          </View>
          <View style={[styles.toggleRow, styles.sectionSpacingLarge]}>
            <Text style={styles.toggleLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: 'rgba(17,17,17,0.12)', true: '#111111' }}
              thumbColor="#ffffff"
            />
          </View>
          <View style={[styles.secondaryRow, styles.sectionSpacingLarge]}>
            <View style={[styles.secondaryItem, styles.secondaryItemSpacing]}>
              <MaterialIcons name="payments" size={22} color="#111111" />
              <Text style={styles.secondaryLabel}>Amount</Text>
              <Text style={styles.secondaryValue}>{activity.amountValue} {activity.amountUnit}</Text>
            </View>
            <View style={styles.secondaryItem}>
              <MaterialIcons name="cancel" size={22} color="#111111" />
              <Text style={styles.secondaryLabel}>Cancel</Text>
              <Text style={styles.secondaryValue}>No repeat</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
      <FloatingActionButton style={styles.fab} onPress={handleNavigateToFocus}>
        <MaterialIcons name="play-arrow" size={30} color="#ffffff" />
      </FloatingActionButton>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  errorText: {
    marginTop: 48,
    textAlign: 'center',
    fontSize: 16,
    color: '#111111',
  },
  card: {
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(17,17,17,0.6)',
  },
  timeLabel: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  secondaryRow: {
    flexDirection: 'row',
  },
  secondaryItem: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(17,17,17,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  secondaryItemSpacing: {
    marginRight: 12,
  },
  secondaryLabel: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(17,17,17,0.6)',
  },
  secondaryValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  sectionSpacing: {
    marginTop: 18,
  },
  sectionSpacingLarge: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 48,
  },
});
