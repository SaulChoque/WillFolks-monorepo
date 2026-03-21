import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FriendTimeCard } from '@/components/time/friend-time-card';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { friendTimeZones } from '@/constants/mock-data';

export default function TimeScreen() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeLabel = useMemo(() => formatTime(now), [now]);
  const dateLabel = useMemo(() => formatDate(now), [now]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Time</Text>
        <View style={styles.clockWrapper}>
          <Text style={styles.clock}>{timeLabel}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friends timezones</Text>
        </View>
        {friendTimeZones.map((zone, index) => (
          <FriendTimeCard key={zone.id} item={zone} currentDate={now} index={index} />
        ))}
      </ScrollView>
      <FloatingActionButton style={styles.fab}>
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </FloatingActionButton>
    </SafeAreaView>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 16,
  },
  header: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(17,17,17,0.6)',
  },
  clockWrapper: {
    borderRadius: 32,
    backgroundColor: '#ffffff',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    marginTop: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 10,
  },
  clock: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111111',
    fontVariant: ['tabular-nums'],
  },
  date: {
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(17,17,17,0.6)',
  },
  sectionHeader: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 48,
  },
});
