import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { DayPicker } from "@/components/goals/day-picker";
import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Chip, Field, Main, Notice, PickerField, Row, SectionTitle, Segmented, Stepper, T, Toggle } from "@/components/pixel/ui";
import { GOAL_ICONS, GoalKind, MAX_STAKE, MIN_STAKE, useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useApi } from "@/hooks/use-api";
import { getDeviceLocaleTag, t } from "@/i18n";
import { NewGoal, api } from "@/lib/api";
import { addDays, dayToDate, formatClock, localDate, timeToDate } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import { chainConfig } from "@/lib/chain";
import { Place, currentPlace } from "@/lib/native/location";
import { type InstalledApp, WillfolksNative } from "@/modules/willfolks-native";

const KINDS: GoalKind[] = ["alarm", "appTimer", "locator", "ai"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
/** Days a lost stake stays locked; the copy across the app promises this number. */
const LOCK_DAYS = 2;
/** Apps offered before the user types a search. */
const APP_LIST_LIMIT = 8;

function pickTime(value: string, onChange: (value: string) => void) {
  if (Platform.OS !== "android") return;
  DateTimePickerAndroid.open({
    mode: "time",
    is24Hour: true,
    value: timeToDate(value),
    onChange: (event, date) => {
      if (event.type === "set" && date) onChange(formatClock(date));
    },
  });
}

function pickDate(value: string, onChange: (value: string) => void) {
  if (Platform.OS !== "android") return;
  DateTimePickerAndroid.open({
    mode: "date",
    value: dayToDate(value),
    minimumDate: new Date(),
    onChange: (event, date) => {
      if (event.type === "set" && date) onChange(localDate(date));
    },
  });
}

const formatDay = (value: string) =>
  dayToDate(value).toLocaleDateString(getDeviceLocaleTag(), { day: "numeric", month: "short", year: "numeric" });

/** Row of a pick list: inked when selected. */
function Choice({ title, note, selected, onPress, testID }: { title: string; note?: string; selected: boolean; onPress: () => void; testID?: string }) {
  const theme = usePixelTheme();
  const ink = selected ? theme.bg : theme.fg;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{
        paddingVertical: theme.em(0.4),
        paddingHorizontal: theme.em(0.5),
        borderWidth: theme.line,
        borderColor: theme.fg,
        backgroundColor: selected ? theme.fg : "transparent",
      }}
    >
      <Main title={title} note={note} color={ink} />
    </Pressable>
  );
}

export default function NewGoalScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { state, actions } = useAppStore();
  const params = useLocalSearchParams<{ kind?: string; stake?: string }>();
  const kind = KINDS.includes(params.kind as GoalKind) ? (params.kind as GoalKind) : "alarm";

  const [title, setTitle] = useState(() => t(`form.defaults.${kind}`));
  const [stake, setStake] = useState(() => Math.min(MAX_STAKE, Math.max(MIN_STAKE, Number(params.stake) || 5)));
  const [endDate, setEndDate] = useState(() => localDate(addDays(new Date(), 30)));
  const [repeatDays, setRepeatDays] = useState(ALL_DAYS);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [tip, setTip] = useState(0);
  const [notifications, setNotifications] = useState(true);
  // Alarm
  const [time, setTime] = useState("07:00");
  const [reaction, setReaction] = useState(60);
  const [vibration, setVibration] = useState(true);
  // App timer
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [appQuery, setAppQuery] = useState("");
  const [app, setApp] = useState<InstalledApp | null>(null);
  const [minutes, setMinutes] = useState(30);
  // Locator
  const [place, setPlace] = useState<Place | null>(null);
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState(150);
  const [arriveBy, setArriveBy] = useState("08:00");
  // AI
  const [prompt, setPrompt] = useState("");
  const [verifier, setVerifier] = useState<"ai" | "friend">("ai");
  const [judgeId, setJudgeId] = useState<string | null>(null);
  // Shared
  const [invited, setInvited] = useState<string[]>([]);
  const [groupMode, setGroupMode] = useState<"coop" | "vs">("vs");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const friends = useApi(api.friends).data?.friends ?? [];
  // With the on-chain escrow the contract caps the stake and goals are personal for now.
  const [escrowCap, setEscrowCap] = useState<number | null>(null);
  useEffect(() => {
    chainConfig().then((config) => setEscrowCap(config.enabled ? config.maxStake : null)).catch(() => {});
  }, []);
  const maxStake = escrowCap === null ? MAX_STAKE : Math.min(MAX_STAKE, escrowCap);
  useEffect(() => {
    setStake((current) => Math.min(current, maxStake));
  }, [maxStake]);

  useEffect(() => {
    if (kind !== "appTimer") return;
    WillfolksNative?.getInstalledApps().then(setApps, () => {});
  }, [kind]);

  const shownApps = (
    appQuery.trim()
      ? apps.filter((item) => item.appName.toLowerCase().includes(appQuery.trim().toLowerCase()))
      : apps
  ).slice(0, APP_LIST_LIMIT);

  const locate = async () => {
    setLocating(true);
    setError(null);
    try {
      const found = await currentPlace();
      if (found) setPlace(found);
      else setError(t("native.location.denied"));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setLocating(false);
    }
  };

  const short = state.balance.available < stake;
  const missing =
    !title.trim() ? "title"
    : kind === "appTimer" && !app ? "app"
    : kind === "locator" && !place ? "place"
    : kind === "ai" && prompt.trim().length < 3 ? "prompt"
    : kind === "ai" && verifier === "friend" && !judgeId ? "judge"
    : null;

  const submit = async () => {
    if (busy || missing || short) return;
    const input: NewGoal = {
      kind,
      title: title.trim(),
      stakeAmount: stake,
      startDate: localDate(),
      endDate,
      repeatDays,
      notificationsEnabled: notifications,
      maxAttempts,
      extraLockDays: LOCK_DAYS,
      devTipPercent: tip,
      ...(invited.length ? { participantIds: invited, groupMode } : {}),
      ...(kind === "alarm" ? { alarm: { targetTime: time, reactionSeconds: reaction, vibrationEnabled: vibration } } : {}),
      ...(kind === "appTimer" && app ? { appTimer: { appPackage: app.packageName, appName: app.appName.slice(0, 80), maxDailyMinutes: minutes } } : {}),
      ...(kind === "locator" && place
        ? { location: { placeLabel: place.label.trim() || t("form.place.fallback"), latitude: place.latitude, longitude: place.longitude, radiusM: radius, arriveBy } }
        : {}),
      ...(kind === "ai" ? { ai: { prompt: prompt.trim(), verifier, ...(verifier === "friend" && judgeId ? { verifierUserId: judgeId } : {}) } } : {}),
    };
    setBusy(true);
    setError(null);
    try {
      const goal = await actions.createGoal(input);
      router.replace(`/activity/${goal.id}`);
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  };

  const toggleInvite = (id: string) =>
    setInvited((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
        <Chip icon={GOAL_ICONS[kind]} solid />
        <Main title={t(`pixel.goals.kinds.${kind}.detail`)} note={t(`form.kindHint.${kind}`)} />
      </View>

      <Card>
        <Field testID="goal-title" label={t("form.title")} value={title} onChangeText={setTitle} maxLength={80} />
        <Stepper testID="goal-stake" label={t("pixel.sheet.stake")} value={stake} unit={t("common.currency")} min={MIN_STAKE} max={maxStake} onChange={setStake} />
        <T v="note">{t("pixel.sheet.available", { amount: state.balance.available.toFixed(2) })}</T>
      </Card>

      {kind === "alarm" ? (
        <Card>
          <PickerField testID="goal-time" label={t("form.alarm.time")} value={time} icon="clock" onPress={() => pickTime(time, setTime)} />
          <Stepper testID="goal-reaction" label={t("form.alarm.reaction")} value={reaction} unit="s" step={15} min={15} max={300} onChange={setReaction} />
          <Row>
            <Main title={t("form.alarm.vibration")} />
            <Toggle checked={vibration} label={t("form.alarm.vibration")} onChange={() => setVibration((value) => !value)} />
          </Row>
        </Card>
      ) : null}

      {kind === "appTimer" ? (
        <Card>
          <T v="label">{t("form.app.pick")}</T>
          {app ? <Choice testID="goal-app-selected" title={app.appName} note={app.packageName} selected onPress={() => setApp(null)} /> : null}
          {!app && apps.length ? (
            <>
              <Field testID="goal-app-search" label={t("form.app.search")} value={appQuery} onChangeText={setAppQuery} autoCorrect={false} />
              <View accessibilityRole="radiogroup" style={{ gap: theme.em(0.3) }}>
                {shownApps.map((item, index) => (
                  <Choice key={item.packageName} testID={`goal-app-${index}`} title={item.appName} note={item.packageName} selected={false} onPress={() => setApp(item)} />
                ))}
              </View>
            </>
          ) : null}
          {!app && !apps.length ? <Notice tone="info">{t("form.app.none")}</Notice> : null}
          <Stepper testID="goal-minutes" label={t("form.app.limit")} value={minutes} unit={t("form.app.perDay")} step={5} min={5} max={240} onChange={setMinutes} />
          {WillfolksNative && !WillfolksNative.hasUsageAccess() ? <Notice tone="info">{t("form.app.needsAccess")}</Notice> : null}
        </Card>
      ) : null}

      {kind === "locator" ? (
        <Card>
          <Btn
            testID="goal-locate"
            label={locating ? t("common.working") : place ? t("form.place.again") : t("form.place.use")}
            icon="pin"
            variant={place ? "line" : "solid"}
            disabled={locating}
            onPress={locate}
          />
          {place ? (
            <>
              <Field testID="goal-place" label={t("form.place.label")} value={place.label} onChangeText={(label) => setPlace({ ...place, label })} maxLength={120} />
              <T v="note" testID="goal-coords">{`${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`}</T>
            </>
          ) : null}
          <Stepper testID="goal-radius" label={t("form.place.radius")} value={radius} unit="m" step={50} min={50} max={1000} onChange={setRadius} />
          <PickerField testID="goal-arrive" label={t("form.place.arriveBy")} value={arriveBy} icon="clock" onPress={() => pickTime(arriveBy, setArriveBy)} />
        </Card>
      ) : null}

      {kind === "ai" ? (
        <Card>
          <Field
            testID="goal-prompt"
            label={t("form.ai.prompt")}
            hint={t("form.ai.promptHint")}
            value={prompt}
            onChangeText={setPrompt}
            maxLength={1000}
            multiline
            style={{ minHeight: theme.em(4.5), textAlignVertical: "top" }}
          />
          <T v="label">{t("form.ai.judge")}</T>
          <Segmented
            testID="goal-verifier"
            value={verifier}
            onChange={setVerifier}
            options={[
              { value: "ai", label: t("form.ai.judgeAi") },
              { value: "friend", label: t("form.ai.judgeFriend") },
            ]}
          />
          {verifier === "friend" ? (
            friends.length ? (
              <View accessibilityRole="radiogroup" style={{ gap: theme.em(0.3) }}>
                {friends.map((friend) => (
                  <Choice
                    key={friend.user.id}
                    title={friend.user.displayName}
                    note={friend.user.username ? `@${friend.user.username}` : undefined}
                    selected={judgeId === friend.user.id}
                    onPress={() => setJudgeId(friend.user.id)}
                  />
                ))}
              </View>
            ) : (
              <Notice tone="info">{t("form.noFriends")}</Notice>
            )
          ) : null}
        </Card>
      ) : null}

      <SectionTitle>{t("form.schedule")}</SectionTitle>
      <Card>
        <T v="label">{t("pixel.goals.days")}</T>
        <DayPicker value={repeatDays} onChange={setRepeatDays} />
        <PickerField testID="goal-end" label={t("form.endDate")} value={formatDay(endDate)} icon="calendar" onPress={() => pickDate(endDate, setEndDate)} />
        <Stepper testID="goal-attempts" label={t("form.attempts")} value={maxAttempts} min={1} max={5} onChange={setMaxAttempts} />
        <Stepper testID="goal-tip" label={t("pixel.goals.tip")} value={tip} unit="%" step={5} min={0} max={20} onChange={setTip} />
        <Row>
          <Main title={t("activity.notifications")} note={t("form.notificationsHint")} />
          <Toggle checked={notifications} label={t("activity.notifications")} onChange={() => setNotifications((value) => !value)} />
        </Row>
      </Card>

      {friends.length && kind !== "ai" && escrowCap === null ? (
        <>
          <SectionTitle>{t("form.invite")}</SectionTitle>
          <Card>
            <View style={{ gap: theme.em(0.3) }}>
              {friends.map((friend) => (
                <Choice
                  key={friend.user.id}
                  testID={`goal-invite-${friend.user.username}`}
                  title={friend.user.displayName}
                  note={friend.user.username ? `@${friend.user.username}` : undefined}
                  selected={invited.includes(friend.user.id)}
                  onPress={() => toggleInvite(friend.user.id)}
                />
              ))}
            </View>
            {invited.length ? (
              <>
                <Segmented
                  testID="goal-mode"
                  value={groupMode}
                  onChange={setGroupMode}
                  options={[
                    { value: "vs", label: t("form.mode.vs") },
                    { value: "coop", label: t("form.mode.coop") },
                  ]}
                />
                <T v="note">{t(`form.mode.${groupMode}Hint`)}</T>
              </>
            ) : null}
          </Card>
        </>
      ) : null}

      {short ? <Notice>{t("errors.INSUFFICIENT_FUNDS", { available: state.balance.available.toFixed(2) })}</Notice> : null}
      {error ? <Notice>{error}</Notice> : null}
      {missing ? <T v="note">{`● ${t(`form.missing.${missing}`)}`}</T> : null}

      {short ? (
        <Btn testID="goal-deposit" label={t("walletScreen.deposit")} icon="coin" onPress={() => router.push("/wallet")} />
      ) : (
        <Btn
          testID="goal-submit"
          label={busy ? t("common.working") : t("pixel.sheet.confirm")}
          icon="lock"
          size="xl"
          disabled={busy || Boolean(missing)}
          style={busy || missing ? { opacity: 0.45 } : undefined}
          onPress={submit}
        />
      )}
      <T v="h2">{`▼ ${t("pixel.sheet.ifMiss")}`}</T>
    </Screen>
  );
}
