import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerAndroid,
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { ReactNode, useCallback, useEffect, useState } from "react";
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
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { InstalledApp, installedApps } from "@/constants/mock-data";
import { AppColors } from "@/constants/theme";
import { t } from "@/i18n";
import {
    Activity,
    ActivityDraftState,
    DaySelection,
    MaterialIconName,
} from "@/types/home";
import { formatDateTime, formatDuration, formatTime } from "@/utils/datetime";
import { DaySelector } from "./day-selector";

type PickerField = "start" | "end" | "objective";

type WilliamType = ActivityDraftState["type"];

export interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const [isActive, setIsActive] = useState(activity.isActive);

  const typeText = typeLabel(activity.type);

  return (
    <Animated.View entering={FadeInDown.springify()}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{activity.titulo}</Text>
              <Text
                style={styles.subtitle}
              >{`${typeText} · ${activity.estado}`}</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{
                false: AppColors.lilac.switchOff,
                true: AppColors.lilac.switchOn,
              }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <DetailRow
            icon="payments"
            label={t("activity.stakeAmount")}
            value={`${activity.montoStake} USDC`}
          />
          <DetailRow
            icon="group"
            label={t("activity.participants")}
            value={formatParticipants(activity.participantes)}
          />
          <DetailRow
            icon="groups"
            label={t("activity.isGroup")}
            value={
              activity.esGrupal ? t("common.enabled") : t("common.disabled")
            }
          />
          <DetailRow
            icon="event"
            label={t("activity.start")}
            value={formatDateTime(activity.fechaInicio)}
          />
          <DetailRow
            icon="hourglass-bottom"
            label={t("activity.end")}
            value={formatDateTime(activity.fechaFin)}
          />
          <DetailRow
            icon="lock-clock"
            label={t("activity.defiLockDays")}
            value={`${activity.diasBloqueoDefiExtra}`}
          />
          <DetailRow
            icon="percent"
            label={t("activity.devTipPercentage")}
            value={`${activity.porcentajeTipDev}%`}
          />

          {activity.type === "irl" ? <IRLDetails activity={activity} /> : null}
          {activity.type === "alarm" ? (
            <AlarmDetails activity={activity} />
          ) : null}
          {activity.type === "timer" ? (
            <AppTimerDetails activity={activity} />
          ) : null}

          {/* Campos legacy (fuera del UML): se mantienen comentados y no se eliminan.
          <DetailRow icon="notifications" label={t("activity.notifications")} value={activity.notificationsEnabled ? t("common.enabled") : t("common.disabled")} />
          <DetailRow icon="payments" label={t("activity.amount")} value={activity.amountLabel} />
          */}
        </View>
      </View>
    </Animated.View>
  );
}

function IRLDetails({
  activity,
}: {
  activity: Extract<Activity, { type: "irl" }>;
}) {
  return (
    <>
      <SectionTitle label={t("activity.irlSection")} />
      <DetailRow
        icon="psychology"
        label={t("activity.aiPrompt")}
        value={activity.promptIA || t("common.none")}
      />
      <DetailRow
        icon="photo-library"
        label={t("activity.evidenceCids")}
        value={t("activity.irlEvidenceCount", {
          count: activity.cidsEvidencia.length,
        })}
      />
    </>
  );
}

function AlarmDetails({
  activity,
}: {
  activity: Extract<Activity, { type: "alarm" }>;
}) {
  return (
    <>
      <SectionTitle label={t("activity.alarmSection")} />
      <DetailRow
        icon="alarm"
        label={t("activity.objectiveTime")}
        value={formatTime(activity.horaObjetivo)}
      />
      <DetailRow
        icon="calendar-today"
        label={t("activity.activeDays")}
        value={formatActiveDays(activity.diasActivos)}
      />
      <DetailRow
        icon="timer"
        label={t("activity.maxReactionSeconds")}
        value={`${activity.tiempoMaximoReaccionSegundos}s`}
      />
    </>
  );
}

function AppTimerDetails({
  activity,
}: {
  activity: Extract<Activity, { type: "timer" }>;
}) {
  const appName = activity.timerSettings.appName || activity.appObjetivoId;

  return (
    <>
      <SectionTitle label={t("activity.appTimerSection")} />
      <DetailRow icon="apps" label={t("activity.targetApp")} value={appName} />
      <DetailRow
        icon="timelapse"
        label={t("activity.weeklyMaxMinutes")}
        value={formatDuration(activity.minutosMaximosSemana)}
      />
    </>
  );
}

interface ActivityDraftCardProps {
  draft: ActivityDraftState;
  onSave: (draft: ActivityDraftState) => void;
  onDiscard: () => void;
  onChange: (draft: ActivityDraftState) => void;
}

export function ActivityDraftCard({
  draft,
  onSave,
  onDiscard,
  onChange,
}: ActivityDraftCardProps) {
  const [form, setForm] = useState<ActivityDraftState>(draft);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [appModalVisible, setAppModalVisible] = useState(false);
  const [iosPicker, setIosPicker] = useState<{
    field: PickerField;
    date: Date;
  } | null>(null);

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

  const handleTypeSelect = (type: WilliamType) => {
    updateForm((prev) => ({
      ...prev,
      type,
      iconName:
        type === "alarm" ? "alarm" : type === "timer" ? "timer" : "psychology",
    }));
    setTypeModalVisible(false);
  };

  const handleAppSelect = (app: InstalledApp) => {
    updateForm((prev) => ({
      ...prev,
      appObjetivoId: app.id,
      timerSettings: {
        ...prev.timerSettings,
        appId: app.id,
        appName: app.name,
      },
    }));
    setAppModalVisible(false);
  };

  const handleToggleAlarmDay = (id: string) => {
    updateForm((prev) => ({
      ...prev,
      diasActivos: prev.diasActivos.map((day) =>
        day.id === id ? { ...day, isActive: !day.isActive } : day,
      ),
    }));
  };

  const openDatePicker = (field: PickerField) => {
    const currentValue = new Date(
      field === "objective"
        ? form.horaObjetivo
        : field === "start"
          ? form.fechaInicio
          : form.fechaFin,
    );

    if (Platform.OS === "android") {
      openAndroidPicker(field, currentValue, persistDate);
    } else {
      setIosPicker({ field, date: currentValue });
    }
  };

  const persistDate = (field: PickerField, value: Date) => {
    updateForm((prev) => {
      if (field === "objective") {
        return {
          ...prev,
          horaObjetivo: value.toISOString(),
          alarmSettings: {
            ...prev.alarmSettings,
            alarmTime: value.toISOString(),
          },
        };
      }

      const targetKey = field === "start" ? "fechaInicio" : "fechaFin";
      const scheduleKey = field === "start" ? "start" : "end";
      return {
        ...prev,
        [targetKey]: value.toISOString(),
        schedule: {
          ...prev.schedule,
          [scheduleKey]: value.toISOString(),
        },
      };
    });
  };

  const handlePickEvidenceFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];
    updateForm((prev) => ({
      ...prev,
      cidsEvidencia: [...prev.cidsEvidencia, asset.uri],
    }));
  };

  const handleCaptureEvidence = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    updateForm((prev) => ({
      ...prev,
      cidsEvidencia: [...prev.cidsEvidencia, result.assets[0].uri],
    }));
  };

  const handleParticipantsChange = (text: string) => {
    updateForm((prev) => ({
      ...prev,
      participantes: text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }));
  };

  const handleSave = () => onSave(form);

  const weeklyHours = Math.floor(form.minutosMaximosSemana / 60).toString();
  const weeklyMinutes = (form.minutosMaximosSemana % 60)
    .toString()
    .padStart(2, "0");

  const handleWeeklyDuration = (part: "hours" | "minutes", value: string) => {
    const numeric = Number.parseInt(value, 10);
    if (Number.isNaN(numeric) || numeric < 0) {
      return;
    }

    updateForm((prev) => {
      const current = prev.minutosMaximosSemana;
      const hours = part === "hours" ? numeric : Math.floor(current / 60);
      const minutes = part === "minutes" ? numeric : current % 60;
      return {
        ...prev,
        minutosMaximosSemana: hours * 60 + minutes,
      };
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <TextInput
              value={form.titulo}
              onChangeText={(value) =>
                updateForm((prev) => ({ ...prev, titulo: value, title: value }))
              }
              placeholder={t("activity.titlePlaceholder")}
              style={styles.titleInput}
            />
            <Text style={styles.subtitle}>{typeLabel(form.type)}</Text>
          </View>
          <Switch
            value={form.esGrupal}
            onValueChange={(value) =>
              updateForm((prev) => ({ ...prev, esGrupal: value }))
            }
            trackColor={{
              false: AppColors.lilac.switchOff,
              true: AppColors.lilac.switchOn,
            }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <View style={styles.contentContainer}>
        <DetailRow
          icon="category"
          label={t("activity.type")}
          value={typeLabel(form.type)}
          onPress={() => setTypeModalVisible(true)}
        />

        <SectionTitle label={t("activity.baseSection")} />

        <InputRow
          icon="group"
          label={t("activity.participants")}
          value={form.participantes.join(", ")}
          onChangeText={handleParticipantsChange}
          placeholder={t("activity.participantsPlaceholder")}
        />

        <InputRow
          icon="payments"
          label={t("activity.stakeAmount")}
          value={String(form.montoStake)}
          onChangeText={(value) =>
            updateForm((prev) => ({
              ...prev,
              montoStake: Number.parseFloat(value || "0") || 0,
            }))
          }
          keyboardType="numeric"
        />

        <DetailRow
          icon="event"
          label={t("activity.start")}
          value={formatDateTime(form.fechaInicio)}
          onPress={() => openDatePicker("start")}
        />
        <DetailRow
          icon="hourglass-bottom"
          label={t("activity.end")}
          value={formatDateTime(form.fechaFin)}
          onPress={() => openDatePicker("end")}
        />

        <InputRow
          icon="lock-clock"
          label={t("activity.defiLockDays")}
          value={String(form.diasBloqueoDefiExtra)}
          onChangeText={(value) =>
            updateForm((prev) => ({
              ...prev,
              diasBloqueoDefiExtra: Number.parseInt(value || "0", 10) || 0,
            }))
          }
          keyboardType="numeric"
        />

        <InputRow
          icon="percent"
          label={t("activity.devTipPercentage")}
          value={String(form.porcentajeTipDev)}
          onChangeText={(value) =>
            updateForm((prev) => ({
              ...prev,
              porcentajeTipDev: Number.parseFloat(value || "0") || 0,
            }))
          }
          keyboardType="numeric"
        />

        <InputRow
          icon="flag"
          label={t("activity.status")}
          value={form.estado}
          onChangeText={(value) =>
            updateForm((prev) => ({
              ...prev,
              estado: normalizeStatus(value),
            }))
          }
        />

        {form.type === "irl" ? (
          <>
            <SectionTitle label={t("activity.irlSection")} />
            <InputRow
              icon="psychology"
              label={t("activity.aiPrompt")}
              value={form.promptIA}
              onChangeText={(value) =>
                updateForm((prev) => ({ ...prev, promptIA: value }))
              }
              multiline
            />

            <DetailRow
              icon="photo-library"
              label={t("activity.evidenceCids")}
              value={t("activity.irlEvidenceCount", {
                count: form.cidsEvidencia.length,
              })}
            />

            <View style={styles.inlineButtonsRow}>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={handleCaptureEvidence}
              >
                <MaterialIcons
                  name="photo-camera"
                  size={16}
                  color={AppColors.lilac.iconStrong}
                />
                <Text style={styles.secondaryButtonLabel}>
                  {t("activity.captureEvidence")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={handlePickEvidenceFile}
              >
                <MaterialIcons
                  name="attach-file"
                  size={16}
                  color={AppColors.lilac.iconStrong}
                />
                <Text style={styles.secondaryButtonLabel}>
                  {t("activity.attachEvidence")}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {form.type === "alarm" ? (
          <>
            <SectionTitle label={t("activity.alarmSection")} />
            <DetailRow
              icon="alarm"
              label={t("activity.objectiveTime")}
              value={formatTime(form.horaObjetivo)}
              onPress={() => openDatePicker("objective")}
            />

            <InputRow
              icon="timer"
              label={t("activity.maxReactionSeconds")}
              value={String(form.tiempoMaximoReaccionSegundos)}
              onChangeText={(value) =>
                updateForm((prev) => ({
                  ...prev,
                  tiempoMaximoReaccionSegundos:
                    Number.parseInt(value || "0", 10) || 0,
                }))
              }
              keyboardType="numeric"
            />

            <SectionTitle label={t("activity.activeDays")} />
            <DaySelector
              days={form.diasActivos}
              onToggleDay={handleToggleAlarmDay}
            />
          </>
        ) : null}

        {form.type === "timer" ? (
          <>
            <SectionTitle label={t("activity.appTimerSection")} />
            <DetailRow
              icon="apps"
              label={t("activity.targetApp")}
              value={form.timerSettings.appName || form.appObjetivoId}
              onPress={() => setAppModalVisible(true)}
            />

            <View style={styles.durationRow}>
              <DetailRow
                icon="timelapse"
                label={t("activity.weeklyMaxMinutes")}
              />
              <View style={styles.durationInputs}>
                <TextInput
                  value={weeklyHours}
                  keyboardType="numeric"
                  onChangeText={(value) => handleWeeklyDuration("hours", value)}
                  style={styles.durationInput}
                />
                <Text style={styles.durationSeparator}>
                  {t("activities.hour")}
                </Text>
                <TextInput
                  value={weeklyMinutes}
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    handleWeeklyDuration("minutes", value)
                  }
                  style={styles.durationInput}
                />
                <Text style={styles.durationSeparator}>
                  {t("activities.minute")}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {/* Campos legacy (fuera del UML): se mantienen comentados y no se eliminan.
        <InputRow icon="payments" label={t("activity.amount")} value={form.amountLabel} onChangeText={(value) => updateForm((prev) => ({ ...prev, amountLabel: value }))} />
        <DetailRow icon="notifications" label={t("activity.notifications")} trailing={<Switch value={form.notificationsEnabled} onValueChange={(value) => updateForm((prev) => ({ ...prev, notificationsEnabled: value }))} />} />
        */}

        <View style={styles.draftActions}>
          <Pressable style={styles.secondaryButton} onPress={onDiscard}>
            <Text style={styles.secondaryButtonLabel}>
              {t("common.cancel")}
            </Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonLabel}>
              {t("activity.saveActivity")}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={typeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("activity.selectType")}</Text>
            {(["irl", "alarm", "timer"] as const).map((option) => (
              <Pressable
                key={option}
                style={styles.modalOption}
                onPress={() => handleTypeSelect(option)}
              >
                <Text style={styles.modalOptionText}>{typeLabel(option)}</Text>
                {form.type === option ? (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={AppColors.lilac.iconStrong}
                  />
                ) : null}
              </Pressable>
            ))}
            <Pressable
              style={styles.modalCancel}
              onPress={() => setTypeModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t("common.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={appModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAppModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("activity.selectApp")}</Text>
            <FlatList
              data={installedApps}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalOption}
                  onPress={() => handleAppSelect(item)}
                >
                  <MaterialIcons
                    name={item.iconName as MaterialIconName}
                    size={20}
                    color={AppColors.lilac.iconStrong}
                    style={styles.modalOptionIcon}
                  />
                  <Text style={styles.modalOptionText}>{item.name}</Text>
                  {form.appObjetivoId === item.id ? (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={AppColors.lilac.iconStrong}
                    />
                  ) : null}
                </Pressable>
              )}
            />
            <Pressable
              style={styles.modalCancel}
              onPress={() => setAppModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t("common.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={iosPicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setIosPicker(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {iosPicker ? (
              <>
                <DateTimePicker
                  value={iosPicker.date}
                  mode={iosPicker.field === "objective" ? "time" : "datetime"}
                  onChange={(
                    _event: DateTimePickerEvent,
                    selectedDate?: Date,
                  ) => {
                    if (selectedDate) {
                      setIosPicker({
                        field: iosPicker.field,
                        date: selectedDate,
                      });
                    }
                  }}
                />
                <View style={styles.modalPickerActions}>
                  <Pressable
                    style={styles.modalCancel}
                    onPress={() => setIosPicker(null)}
                  >
                    <Text style={styles.modalCancelText}>
                      {t("common.cancel")}
                    </Text>
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
                    <Text style={styles.modalConfirmText}>
                      {t("common.confirm")}
                    </Text>
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
        android_ripple: { color: AppColors.lilac.chip },
        onPress,
      }
    : {};

  return (
    <Wrapper style={styles.detailRow} {...wrapperProps}>
      <View style={styles.detailIcon}>
        <MaterialIcons
          name={icon}
          size={20}
          color={AppColors.lilac.iconStrong}
        />
      </View>
      <View style={styles.detailTexts}>
        <Text style={styles.detailLabel}>{label}</Text>
        {value ? <Text style={styles.detailValue}>{value}</Text> : null}
      </View>
      {trailing}
    </Wrapper>
  );
}

function InputRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  icon: MaterialIconName;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputRow}>
      <DetailRow icon={icon} label={label} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline ? styles.multilineInput : null]}
      />
    </View>
  );
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function typeLabel(value: WilliamType) {
  if (value === "irl") {
    return t("activity.irl");
  }
  return value === "alarm" ? t("activity.alarm") : t("activity.timer");
}

function normalizeStatus(value: string): ActivityDraftState["estado"] {
  const lowered = value.trim().toLowerCase();
  if (
    lowered === "active" ||
    lowered === "paused" ||
    lowered === "completed" ||
    lowered === "cancelled"
  ) {
    return lowered;
  }
  return "draft";
}

function formatParticipants(participantes: string[]) {
  if (!participantes.length) {
    return t("common.none");
  }
  return participantes.join(", ");
}

function formatActiveDays(days: DaySelection[]) {
  const selected = days.filter((day) => day.isActive).map((day) => day.label);
  if (!selected.length) {
    return t("common.none");
  }
  return selected.join(", ");
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 0,
    backgroundColor: "#ffffff",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.lilac.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: AppColors.lilac.textSecondary,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.lilac.textPrimary,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: AppColors.lilac.textSecondary,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.lilac.chip,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTexts: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: AppColors.lilac.textSecondary,
  },
  detailValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.lilac.textPrimary,
  },
  inputRow: {
    marginTop: 6,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.lilac.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: AppColors.lilac.textPrimary,
    fontWeight: "600",
  },
  multilineInput: {
    minHeight: 74,
    textAlignVertical: "top",
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  durationInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  durationInput: {
    width: 48,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.lilac.border,
    textAlign: "center",
    color: AppColors.lilac.textPrimary,
    fontWeight: "600",
  },
  durationSeparator: {
    fontSize: 14,
    color: AppColors.lilac.textSecondary,
  },
  draftActions: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },
  inlineButtonsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonSmall: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.lilac.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    flexDirection: "row",
    gap: 6,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.lilac.border,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.lilac.textPrimary,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: AppColors.lilac.switchOn,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.lilac.textPrimary,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: AppColors.lilac.textPrimary,
    flex: 1,
  },
  modalOptionIcon: {
    marginRight: 12,
  },
  modalCancel: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    fontSize: 14,
    color: AppColors.lilac.textSecondary,
  },
  modalPickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalConfirm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: AppColors.lilac.switchOn,
    borderRadius: 12,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});

function openAndroidPicker(
  field: PickerField,
  currentValue: Date,
  persist: (field: PickerField, value: Date) => void,
) {
  if (field === "objective") {
    DateTimePickerAndroid.open({
      value: currentValue,
      mode: "time",
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
    mode: "date",
    onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (!selectedDate) {
        return;
      }
      const withDate = mergeDateAndTime(selectedDate, currentValue);
      DateTimePickerAndroid.open({
        value: withDate,
        mode: "time",
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
