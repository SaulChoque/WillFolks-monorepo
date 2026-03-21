import { memo, useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { FriendTimeZone } from '@/constants/mock-data';

interface FriendTimeCardProps {
  item: FriendTimeZone;
  currentDate: Date;
  index: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const FriendTimeCard = memo(function FriendTimeCard({ item, currentDate, index }: FriendTimeCardProps) {
  const clockLabel = useMemo(() => formattedTimeForZone(item.timeZone, currentDate), [item.timeZone, currentDate]);

  return (
    <AnimatedView style={[styles.container, { opacity: 0.9 + index * 0.03 }]}>
      <View>
        <Text style={styles.city}>{item.city}</Text>
        <Text style={styles.difference}>{item.differenceLabel}</Text>
      </View>
      <Text style={styles.time}>{clockLabel}</Text>
    </AnimatedView>
  );
});

function formattedTimeForZone(timeZone: string, date: Date): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  },
  city: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },
  difference: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(17,17,17,0.6)',
  },
  time: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    fontVariant: ['tabular-nums'],
  },
});
