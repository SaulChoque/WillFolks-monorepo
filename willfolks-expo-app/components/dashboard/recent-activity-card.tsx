import { MaterialIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Activity } from '@/types/home';

interface RecentActivityCardProps {
  activity: Activity;
}

export const RecentActivityCard = memo(function RecentActivityCard({ activity }: RecentActivityCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <MaterialIcons name={activity.iconName} size={24} color="#ffffff" />
      </View>
      <View style={styles.detailColumn}>
        <Text style={styles.title}>{activity.title}</Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="info" size={16} color="rgba(17,17,17,0.6)" style={styles.metaIcon} />
          <Text style={[styles.amount, amountStyle(activity.amountKind)]}>{activity.amountLabel}</Text>
        </View>
      </View>
      <Text style={styles.summaryLabel}>{activity.summaryLabel}</Text>
    </View>
  );
});

function amountStyle(kind: Activity['amountKind']) {
  switch (kind) {
    case 'credit':
      return styles.amountCredit;
    case 'debit':
      return styles.amountDebit;
    default:
      return styles.amountNeutral;
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailColumn: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaIcon: {
    marginRight: 6,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountCredit: {
    color: '#111111',
  },
  amountDebit: {
    color: '#d92d20',
  },
  amountNeutral: {
    color: 'rgba(17,17,17,0.6)',
  },
  summaryLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    fontVariant: ['tabular-nums'],
    marginLeft: 16,
  },
});
