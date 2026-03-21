import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { activitiesMock, accountInfo, dashboardActivityIds } from '@/constants/mock-data';

export default function DashboardScreen() {
  const recentActivities = dashboardActivityIds
    .map((id) => activitiesMock.find((activity) => activity.id === id))
    .filter((activity): activity is NonNullable<typeof activity> => Boolean(activity));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingTitle}>Welcome back, {accountInfo.displayName}</Text>
            <Text style={styles.greetingSubtitle}>Recent activity</Text>
          </View>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={24} color="#111111" />
          </View>
        </View>
        <View style={styles.listContent}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.cardSpacing}>
              <RecentActivityCard activity={activity} />
            </View>
          ))}
        </View>
      </ScrollView>
      <FloatingActionButton style={styles.fab}>
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </FloatingActionButton>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },
  greetingSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(17,17,17,0.6)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  listContent: {
    gap: 16,
  },
  cardSpacing: {
    borderRadius: 24,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 32,
  },
});
