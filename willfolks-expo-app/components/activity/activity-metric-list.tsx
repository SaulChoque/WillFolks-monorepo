import { ComponentProps, memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ActivityMetric } from '@/constants/mock-data';

interface ActivityMetricListProps {
  metrics: ActivityMetric[];
}

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export const ActivityMetricList = memo(function ActivityMetricList({ metrics }: ActivityMetricListProps) {
  return (
    <View style={styles.container}>
      {metrics.map((metric, index) => {
        const isLast = index === metrics.length - 1;
        return (
          <View key={metric.id} style={[styles.item, !isLast && styles.itemSpacing]}>
          <View style={styles.iconBadge}>
            <MaterialIcons
              name={metric.icon as MaterialIconName}
              size={20}
              color="#111111"
            />
          </View>
          <View style={styles.textColumn}>
            <Text style={styles.label}>{metric.label}</Text>
            <Text style={styles.value}>{metric.value}</Text>
          </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.08)',
    backgroundColor: 'rgba(17,17,17,0.04)',
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSpacing: {
    marginBottom: 16,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    marginRight: 12,
  },
  textColumn: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: 'rgba(17,17,17,0.6)',
    letterSpacing: 1,
    fontWeight: '600',
  },
  value: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },
});
