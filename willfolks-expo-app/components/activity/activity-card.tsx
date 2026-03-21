import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Accordion, AccordionItem } from '@mustapha-ghlissi/react-native-accordion';

import { DaySelector } from './day-selector';
import {
  Activity,
  ActivityDraftState,
  MaterialIconName,
} from '@/types/home';
import { InstalledApp, installedApps } from '@/constants/mock-data';
import { formatDateTime, formatDuration, formatTime } from '@/utils/datetime';

type PickerField = 'start' | 'end' | 'alarm';

export interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const [isActive, setIsActive] = useState(activity.isActive);
  const [notificationsEnabled, setNotificationsEnabled] = useState(activity.notificationsEnabled);

  const headerContent = (
    <View style={styles.headerContent}>
      <View>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.subtitle}>{activity.repeatLabel}</Text>
      </View>
      <Switch
        value={isActive}
        onValueChange={setIsActive}
        trackColor={{ false: 'rgba(17,17,17,0.12)', true: '#111111' }}
        thumbColor="#ffffff"
      />
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.springify()}>
      <Accordion containerStyle={styles.accordionContainer}>
        <AccordionItem
        title={headerContent}
        rightIcon={
          <View style={styles.chevronBadge}>
            <MaterialIcons name="keyboard-arrow-right" size={22} color="#111111" />
          </View>
        }
        headerStyle={styles.header}
        titleContainerStyle={styles.titleContainer}
        itemContainerStyle={styles.card}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.sectionSpacing}>
          <DaySelector days={activity.days} />
        </View>
        <View style={styles.sectionSpacing}>
          {activity.type === 'alarm' ? (
            <AlarmDetails activity={activity} notificationsEnabled={notificationsEnabled} setNotificationsEnabled={setNotificationsEnabled} />
          ) : (
            <TimerDetails activity={activity} notificationsEnabled={notificationsEnabled} setNotificationsEnabled={setNotificationsEnabled} />
          )}
        </View>
      </AccordionItem>
      </Accordion>
    </Animated.View>
  );
}

interface AlarmDetailsProps {
  activity: Extract<Activity, { type: 'alarm' }>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
}

function AlarmDetails({ activity, notificationsEnabled, setNotificationsEnabled }: AlarmDetailsProps) {
  return (
    <View>
      <DetailRow icon="notifications-active" label="Type" value="Alarm" />
      <DetailRow icon="alarm" label="Alarm" value={formatTime(activity.alarmSettings.alarmTime)} />
      <SectionTitle label="Time and date" />
      <DetailRow icon="event" label="Start" value={formatDateTime(activity.schedule.start)} />
      <DetailRow icon="hourglass-bottom" label="End" value={formatDateTime(activity.schedule.end)} />
      <DetailRow icon="library-music" label="Music" value={activity.alarmSettings.musicTitle} />
      <DetailRow icon="vibration" label="Vibration" value={activity.alarmSettings.vibrationEnabled ? 'Enabled' : 'Disabled'} />
      <DetailRow
        icon="notifications"
        label="Notifications"
        trailing={
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: 'rgba(17,17,17,0.12)', true: '#111111' }}
            thumbColor="#ffffff"
          />
        }
      />
      <DetailRow icon="payments" label="Amount" value={activity.amountLabel} />
      <DangerButton label="Cancel" />
    </View>
  );
}

interface TimerDetailsProps {
  activity: Extract<Activity, { type: 'timer' }>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
}

function TimerDetails({ activity, notificationsEnabled, setNotificationsEnabled }: TimerDetailsProps) {
  return (
    <View>
      <DetailRow icon="timer" label="Type" value="Timer" />
      <SectionTitle label="Time and date" />
      <DetailRow icon="event" label="Start" value={formatDateTime(activity.schedule.start)} />
      <DetailRow icon="hourglass-bottom" label="End" value={formatDateTime(activity.schedule.end)} />
      <DetailRow icon="apps" label="App" value={activity.timerSettings.appName} />
      <DetailRow icon="timelapse" label="Max time a day" value={formatDuration(activity.timerSettings.maxDailyMinutes)} />
      <DetailRow
        icon="notifications"
        label="Notifications"
        trailing={
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: 'rgba(17,17,17,0.12)', true: '#111111' }}
            thumbColor="#ffffff"
          />
        }
      />
      <DetailRow icon="payments" label="Amount" value={activity.amountLabel} />
      <DangerButton label="Cancel" />
    </View>
  );
}

interface ActivityDraftCardProps {
  draft: ActivityDraftState;
  onSave: (draft: ActivityDraftState) => void;
  onDiscard: () => void;
  onChange: (draft: ActivityDraftState) => void;
}

export function ActivityDraftCard({ draft, onSave, onDiscard, onChange }: ActivityDraftCardProps) {
  const [form, setForm] = useState<ActivityDraftState>(draft);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [appModalVisible, setAppModalVisible] = useState(false);
  const [iosPicker, setIosPicker] = useState<{ field: PickerField; date: Date } | null>(null);

  useEffect(() => {
    setForm(draft);
  }, [draft]);

  const updateForm = useCallback(
    (updater: (prev: ActivityDraftState) => ActivityDraftState) => {
      setForm((prev) => {
        const next = updater(prev);
        onChange(next);
        return next;
      });
    },
    [onChange],
  );

  const handleToggleDay = (id: string) => {
    updateForm((prev) => ({
      ...prev,
      days: prev.days.map((day) => (day.id === id ? { ...day, isActive: !day.isActive } : day)),
    }));
  };

  const handleTypeSelect = (type: 'alarm' | 'timer') => {
    updateForm((prev) => ({
      ...prev,
      type,
      iconName: type === 'alarm' ? 'alarm' : 'timer',
    }));
    setTypeModalVisible(false);
  };

  const handleAppSelect = (app: InstalledApp) => {
    updateForm((prev) => ({
      ...prev,
      timerSettings: {
        ...prev.timerSettings,
        appId: app.id,
        appName: app.name,
      },
    }));
    setAppModalVisible(false);
  };

  const openDatePicker = (field: PickerField) => {
    const currentValue = new Date(
      field === 'alarm' ? form.alarmSettings.alarmTime : field === 'start' ? form.schedule.start : form.schedule.end,
    );

    if (Platform.OS === 'android') {
      openAndroidPicker(field, currentValue, persistDate);
    } else {
      setIosPicker({ field, date: currentValue });
    }
  };

  const persistDate = (field: PickerField, value: Date) => {
    updateForm((prev) => {
      if (field === 'alarm') {
        return {
          ...prev,
          alarmSettings: {
            ...prev.alarmSettings,
            alarmTime: value.toISOString(),
          },
          summaryLabel: formatTime(value.toISOString()),
        };
      }
      const scheduleKey = field === 'start' ? 'start' : 'end';
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          [scheduleKey]: value.toISOString(),
        },
      };
    });
  };

  const handleMusicPick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', multiple: false });
    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];
    updateForm((prev) => ({
      ...prev,
      alarmSettings: {
        ...prev.alarmSettings,
        musicTitle: file.name,
      },
    }));
  };

  const handleSave = () => {
    onSave(form);
  };

  const hoursValue = Math.floor(form.timerSettings.maxDailyMinutes / 60).toString();
  const minutesValue = (form.timerSettings.maxDailyMinutes % 60).toString().padStart(2, '0');

  const handleDurationChange = (part: 'hours' | 'minutes', value: string) => {
    const numeric = Number.parseInt(value, 10);
    if (Number.isNaN(numeric) || numeric < 0) return;
    updateForm((prev) => {
      const currentMinutes = prev.timerSettings.maxDailyMinutes;
      const hours = part === 'hours' ? numeric : Math.floor(currentMinutes / 60);
      const minutes = part === 'minutes' ? numeric : currentMinutes % 60;
      return {
        ...prev,
        timerSettings: {
          ...prev.timerSettings,
          maxDailyMinutes: hours * 60 + minutes,
        },
      };
    });
  };

  return (
    <View style={styles.draftCardWrapper}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <TextInput
                value={form.title}
                onChangeText={(text) => updateForm((prev) => ({ ...prev, title: text }))}
                placeholder="Activity title"
                style={styles.titleInput}
              />
              <TextInput
                value={form.repeatLabel}
                onChangeText={(text) => updateForm((prev) => ({ ...prev, repeatLabel: text }))}
                placeholder="Repeat"
                style={styles.subtitleInput}
              />
            </View>
            <Switch
              value={form.isActive}
              onValueChange={(value) => updateForm((prev) => ({ ...prev, isActive: value }))}
              trackColor={{ false: 'rgba(17,17,17,0.12)', true: '#111111' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.sectionSpacing}>
            <DaySelector days={form.days} onToggleDay={handleToggleDay} />
          </View>
          <View style={styles.sectionSpacing}>
            <DetailRow icon="category" label="Type" value={capitalize(form.type)} onPress={() => setTypeModalVisible(true)} />
            {form.type === 'alarm' ? (
              <>
                <DetailRow
                  icon="alarm"
                  label="Alarm"
                  value={formatTime(form.alarmSettings.alarmTime)}
                  onPress={() => openDatePicker('alarm')}
                />
                <SectionTitle label="Time and date" />
                <DetailRow
                  icon="event"
                  label="Start"
                  value={formatDateTime(form.schedule.start)}
                  onPress={() => openDatePicker('start')}
                />
                <DetailRow
                  icon="hourglass-bottom"
                  label="End"
                  value={formatDateTime(form.schedule.end)}
                  onPress={() => openDatePicker('end')}
                />
                <DetailRow icon="library-music" label="Music" value={form.alarmSettings.musicTitle} onPress={handleMusicPick} />
                <DetailRow
                  icon="vibration"
                  label="Vibration"
                  trailing={
                    <Switch
                      value={form.alarmSettings.vibrationEnabled}
                      onValueChange={(value) =>
                        updateForm((prev) => ({
                          ...prev,
                          alarmSettings: {
                            ...prev.alarmSettings,
                            vibrationEnabled: value,
                          },
                        }))
                      }
                      trackColor={{ false: 'rgba(17,17,17,0.12)', true: '#111111' }}
                      thumbColor="#ffffff"
                    />
                  }
                />
              </>
            ) : (
              <>
                <SectionTitle label="Time and date" />
                <DetailRow
                  icon="event"
                  label="Start"
                  value={formatDateTime(form.schedule.start)}
                  onPress={() => openDatePicker('start')}
                />
                <DetailRow
                  icon="hourglass-bottom"
                  label="End"
                  value={formatDateTime(form.schedule.end)}
                  onPress={() => openDatePicker('end')}
                />
                <DetailRow icon="apps" label="App" value={form.timerSettings.appName} onPress={() => setAppModalVisible(true)} />
                <View style={styles.durationRow}>
                  <DetailRow icon="timelapse" label="Max time a day" />
                  <View style={styles.durationInputs}>
                    <TextInput
                      value={hoursValue}
                      keyboardType="numeric"
                      onChangeText={(value) => handleDurationChange('hours', value)}
                      style={styles.durationInput}
                    />
                    <Text style={styles.durationSeparator}>h</Text>
                    <TextInput
                      value={minutesValue}
                      keyboardType="numeric"
                      onChangeText={(value) => handleDurationChange('minutes', value)}
                      style={styles.durationInput}
                    />
                    <Text style={styles.durationSeparator}>m</Text>
                  </View>
                </View>
              </>
            )}
            <DetailRow
              icon="notifications"
              label="Notifications"
              trailing={
                <Switch
                  value={form.notificationsEnabled}
                  onValueChange={(value) => updateForm((prev) => ({ ...prev, notificationsEnabled: value }))}
                  trackColor={{ false: 'rgba(17,17,17,0.12)', true: '#111111' }}
                  thumbColor="#ffffff"
                />
              }
            />
            <View style={styles.amountRow}>
              <DetailRow icon="payments" label="Amount" />
              <TextInput
                value={form.amountLabel}
                onChangeText={(value) => updateForm((prev) => ({ ...prev, amountLabel: value }))}
                style={styles.amountInput}
              />
            </View>
          </View>
          <View style={styles.draftActions}>
            <Pressable style={styles.secondaryButton} onPress={onDiscard}>
              <Text style={styles.secondaryButtonLabel}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonLabel}>Save activity</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={typeModalVisible} transparent animationType="fade" onRequestClose={() => setTypeModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select activity type</Text>
            {(['alarm', 'timer'] as const).map((typeOption) => (
              <Pressable key={typeOption} style={styles.modalOption} onPress={() => handleTypeSelect(typeOption)}>
                <Text style={styles.modalOptionText}>{capitalize(typeOption)}</Text>
                {form.type === typeOption ? <MaterialIcons name="check" size={20} color="#111111" /> : null}
              </Pressable>
            ))}
            <Pressable style={styles.modalCancel} onPress={() => setTypeModalVisible(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={appModalVisible} transparent animationType="fade" onRequestClose={() => setAppModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select app</Text>
            <FlatList
              data={installedApps}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={styles.modalOption} onPress={() => handleAppSelect(item)}>
                  <MaterialIcons name={item.iconName as MaterialIconName} size={20} color="#111111" style={styles.modalOptionIcon} />
                  <Text style={styles.modalOptionText}>{item.name}</Text>
                  {form.timerSettings.appId === item.id ? <MaterialIcons name="check" size={20} color="#111111" /> : null}
                </Pressable>
              )}
            />
            <Pressable style={styles.modalCancel} onPress={() => setAppModalVisible(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={iosPicker !== null} transparent animationType="fade" onRequestClose={() => setIosPicker(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {iosPicker ? (
              <>
                <DateTimePicker
                  value={iosPicker.date}
                  mode={iosPicker.field === 'alarm' ? 'time' : 'datetime'}
                  onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
                    if (selectedDate) {
                      setIosPicker({ field: iosPicker.field, date: selectedDate });
                    }
                  }}
                />
                <View style={styles.modalPickerActions}>
                  <Pressable style={styles.modalCancel} onPress={() => setIosPicker(null)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalConfirm}
                    onPress={() => {
                      if (iosPicker) {
                        persistDate(iosPicker.field, iosPicker.date);
                      }
                      setIosPicker(null);
                    }}
                  >
                    <Text style={styles.modalConfirmText}>Confirm</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  trailing,
  onPress,
}: {
  icon: MaterialIconName;
  label: string;
  value?: string;
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress
    ? {
        android_ripple: { color: 'rgba(17,17,17,0.04)' },
        onPress,
      }
    : {};

  return (
    <Wrapper style={styles.detailRow} {...wrapperProps}>
      <View style={styles.detailIcon}>
        <MaterialIcons name={icon} size={20} color="#111111" />
      </View>
      <View style={styles.detailTexts}>
        <Text style={styles.detailLabel}>{label}</Text>
        {value ? <Text style={styles.detailValue}>{value}</Text> : null}
      </View>
      {trailing}
    </Wrapper>
  );
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function DangerButton({ label }: { label: string }) {
  return (
    <Pressable style={styles.dangerButton}>
      <MaterialIcons name="delete" size={18} color="#d92d20" style={styles.dangerIcon} />
      <Text style={styles.dangerLabel}>{label}</Text>
    </Pressable>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  accordionContainer: {
    gap: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 0,
    backgroundColor: '#ffffff',
  },
  titleContainer: {
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(17,17,17,0.6)',
  },
  chevronBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(17,17,17,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionSpacing: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(17,17,17,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTexts: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(17,17,17,0.6)',
  },
  detailValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(17,17,17,0.6)',
  },
  dangerButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
  },
  dangerIcon: {
    marginRight: 8,
  },
  dangerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d92d20',
  },
  draftCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },
  subtitleInput: {
    marginTop: 4,
    fontSize: 14,
    color: '#111111',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationInput: {
    width: 48,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.16)',
    textAlign: 'center',
    color: '#111111',
    fontWeight: '600',
  },
  durationSeparator: {
    fontSize: 14,
    color: 'rgba(17,17,17,0.6)',
  },
  amountRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInput: {
    marginLeft: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.16)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111111',
    fontWeight: '600',
  },
  draftActions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.12)',
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#111111',
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#111111',
    flex: 1,
  },
  modalOptionIcon: {
    marginRight: 12,
  },
  modalCancel: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    fontSize: 14,
    color: 'rgba(17,17,17,0.6)',
  },
  modalPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalConfirm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#111111',
    borderRadius: 12,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

function openAndroidPicker(
  field: PickerField,
  currentValue: Date,
  persist: (field: PickerField, value: Date) => void,
) {
  if (field === 'alarm') {
    DateTimePickerAndroid.open({
      value: currentValue,
      mode: 'time',
      onChange: (_event: DateTimePickerEvent, selected?: Date) => {
        if (selected) {
          persist(field, selected);
        }
      },
    });
    return;
  }

  DateTimePickerAndroid.open({
    value: currentValue,
    mode: 'date',
    onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (!selectedDate) {
        return;
      }
      const withDate = mergeDateAndTime(selectedDate, currentValue);
      DateTimePickerAndroid.open({
        value: withDate,
        mode: 'time',
        onChange: (_evt: DateTimePickerEvent, selectedTime?: Date) => {
          if (!selectedTime) {
            persist(field, withDate);
            return;
          }
          persist(field, mergeDateAndTime(withDate, selectedTime));
        },
      });
    },
  });
}

function mergeDateAndTime(datePart: Date, timePart: Date) {
  const merged = new Date(datePart);
  merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return merged;
}
