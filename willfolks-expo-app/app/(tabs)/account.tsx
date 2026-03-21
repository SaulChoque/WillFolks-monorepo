import { MaterialIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { accountInfo } from '@/constants/mock-data';

export default function AccountScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Pressable style={styles.iconButton} accessibilityRole="button">
            <MaterialIcons name="share" size={22} color="#111111" />
          </Pressable>
        </View>

        <Card style={styles.primaryCard}>
          <View style={styles.profileHeader}>
            <View style={styles.statusBadge}>
              <MaterialIcons name="check-circle" size={18} color="#111111" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{accountInfo.displayName}</Text>
              <Text style={styles.username}>{accountInfo.username}</Text>
            </View>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={26} color="#111111" />
            </View>
          </View>
          <View style={styles.detailGroup}>
            <DetailRow icon="event" label="Date of invitation" value={accountInfo.dateOfInvitation} />
            <DetailRow icon="device-hub" label="Chain" value={accountInfo.chain} />
            <DetailRow icon="payments" label="Total transacted" value={accountInfo.totalTransacted} />
            <DetailRow icon="star" label="General Score" value={accountInfo.generalScore} />
            <DetailRow icon="location-on" label="Location" value={accountInfo.location} />
          </View>
        </Card>

        <Card style={styles.secondaryCard}>
          <DetailRow icon="groups" label="Number of friends" value={String(accountInfo.numberOfFriends)} />
          <DetailRow icon="flag" label="Goals achieved" value={String(accountInfo.goalsAchieved)} />
          <DetailRow icon="favorite" label="Favorite Friend" value={accountInfo.favoriteFriend} />
          <DetailRow icon="whatshot" label="Streak" value={accountInfo.streak} />
        </Card>

        <Pressable style={styles.deleteRow} accessibilityRole="button">
          <MaterialIcons name="delete" size={20} color="#d92d20" style={styles.deleteIcon} />
          <Text style={styles.deleteLabel}>Delete account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

interface DetailRowProps {
  icon: MaterialIconsName;
  label: string;
  value: string;
}

type MaterialIconsName = ComponentProps<typeof MaterialIcons>['name'];

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <MaterialIcons name={icon} size={20} color="#111111" />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
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
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryCard: {
    gap: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17,17,17,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },
  username: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(17,17,17,0.6)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailGroup: {
    gap: 12,
  },
  secondaryCard: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17,17,17,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'rgba(17,17,17,0.6)',
  },
  detailValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  deleteRow: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  deleteIcon: {
    marginRight: 12,
  },
  deleteLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d92d20',
  },
});
