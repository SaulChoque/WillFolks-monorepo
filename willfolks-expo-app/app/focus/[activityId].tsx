import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { homeActivities } from '@/constants/mock-data';
import { HomeActivity } from '@/types/home';

export default function FocusSessionScreen() {
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();

  const activity = useMemo<HomeActivity | undefined>(
    () => homeActivities.find((item) => item.id === activityId),
    [activityId],
  );

  const timeLabel = activity?.summaryTimeLabel ?? '--:--';
  const title = activity?.title ?? 'Session';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Focus session', presentation: 'modal' }} />
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.time}>{timeLabel}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  time: {
    fontSize: 56,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
});
