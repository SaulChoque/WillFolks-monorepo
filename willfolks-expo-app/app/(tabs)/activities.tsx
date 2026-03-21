import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import ActivityCard, { ActivityDraftCard } from '@/components/activity/activity-card';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { activitiesMock, createEmptyActivityDraft } from '@/constants/mock-data';
import { Activity, ActivityDraftState, MaterialIconName } from '@/types/home';

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>(() => [...activitiesMock]);
  const [draft, setDraft] = useState<ActivityDraftState | null>(null);

  const handleAddDraft = useCallback(() => {
    setDraft((current) => current ?? createEmptyActivityDraft());
  }, []);

  const handleDraftChange = useCallback((next: ActivityDraftState) => {
    setDraft(next);
  }, []);

  const handleDiscardDraft = useCallback(() => {
    setDraft(null);
  }, []);

  const handleSaveDraft = useCallback(
    (nextDraft: ActivityDraftState) => {
      const nextActivity = mapDraftToActivity(nextDraft);
      setActivities((prev) => [nextActivity, ...prev]);
      setDraft(null);
    },
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={<View style={styles.footerSpacing} />}
        renderItem={({ item }) => (
          <View style={styles.cardSpacing}>
            <ActivityCard activity={item} />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.pageTitle}>My activities</Text>
            </View>
            {draft ? (
              <View style={styles.draftSpacing}>
                <ActivityDraftCard
                  draft={draft}
                  onSave={handleSaveDraft}
                  onDiscard={handleDiscardDraft}
                  onChange={handleDraftChange}
                />
              </View>
            ) : null}
          </View>
        }
      />
      <FloatingActionButton style={styles.fab} onPress={handleAddDraft}>
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </FloatingActionButton>
    </SafeAreaView>
  );
}

function mapDraftToActivity(draft: ActivityDraftState): Activity {
  const iconName: MaterialIconName = draft.type === 'alarm' ? 'alarm' : 'timer';

  const base = {
    id: `activity-${Date.now()}`,
    title: draft.title.trim() || 'New activity',
    repeatLabel: draft.repeatLabel,
    summaryLabel:
      draft.type === 'alarm'
        ? formatTimeLabel(draft.alarmSettings.alarmTime)
        : formatDurationLabel(draft.timerSettings.maxDailyMinutes),
    amountLabel: draft.amountLabel,
    amountKind: draft.amountKind,
    iconName,
    days: draft.days.map((day) => ({ ...day })),
    isActive: draft.isActive,
    notificationsEnabled: draft.notificationsEnabled,
    schedule: { ...draft.schedule },
  };

  if (draft.type === 'alarm') {
    return {
      ...base,
      type: 'alarm',
      alarmSettings: { ...draft.alarmSettings },
    };
  }

  return {
    ...base,
    type: 'timer',
    timerSettings: { ...draft.timerSettings },
  };
}

function formatTimeLabel(isoValue: string) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDurationLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }
  if (hours === 0) {
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
  }
  return `${hours}h ${minutes}m`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  headerContainer: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },
  draftSpacing: {
    marginBottom: 8,
  },
  separator: {
    height: 16,
  },
  footerSpacing: {
    height: 140,
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
