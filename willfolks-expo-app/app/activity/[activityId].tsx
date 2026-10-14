import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, View } from "react-native";

import { weekdayLabels } from "@/components/goals/day-picker";
import { Hatch } from "@/components/pixel/effects";
import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Chip, Main, Notice, Row, SectionTitle, T, Toggle } from "@/components/pixel/ui";
import type { PixelIconName } from "@/constants/pixel-icons";
import { GOAL_ICONS, Goal, useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useApi } from "@/hooks/use-api";
import { getDeviceLocaleTag, t } from "@/i18n";
import { ApiError, type ChainConfig, Checkin, api } from "@/lib/api";
import { chainConfig, explorerTx } from "@/lib/chain";
import { dayToDate, formatClock, nextOccurrence } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import { scheduleTestAlarm } from "@/lib/native/alarms";
import { checkInHere } from "@/lib/native/location";
import { hasUsageAccess, minutesFor, usageOn } from "@/lib/native/usage";
import { WillfolksNative } from "@/modules/willfolks-native";

/** The stake's life on the chain: its state and a link to each transaction. */
function EscrowCard({ goal }: { goal: Goal }) {
  const [config, setConfig] = useState<ChainConfig>({ enabled: false });
  useEffect(() => {
    chainConfig().then(setConfig).catch(() => {});
  }, []);
  const { escrow } = goal;
  if (!escrow || escrow.state === "none") return null;
  const links = [
    { key: "createTx", hash: escrow.createTxHash },
    { key: "resolveTx", hash: escrow.resolveTxHash },
    { key: "claimTx", hash: escrow.claimTxHash },
  ].filter((link): link is { key: string; hash: string } => Boolean(link.hash));
  return (
    <Card>
      <T v="label">{t("chain.escrow")}</T>
      <T v="strong" testID="escrow-state">
        {t(`chain.state.${escrow.state}`)}
      </T>
      {escrow.state === "failed_locked" && escrow.unlockAt ? (
        <T v="note">{`${t("chain.unlockAt")}: ${new Date(escrow.unlockAt).toLocaleString(getDeviceLocaleTag())}`}</T>
      ) : null}
      {escrow.state === "active" && escrow.endAt ? (
        <T v="note">{`${t("chain.endAt")}: ${new Date(escrow.endAt).toLocaleString(getDeviceLocaleTag())}`}</T>
      ) : null}
      {links.map((link) => (
        <Btn
          key={link.key}
          testID={`escrow-${link.key}`}
          label={t(`chain.viewTx.${link.key}`)}
          icon="arrow"
          variant="line"
          onPress={() => {
            void Linking.openURL(explorerTx(config, link.hash));
          }}
        />
      ))}
      {escrow.error ? <T v="note">{escrow.error.slice(0, 120)}</T> : null}
    </Card>
  );
}

const formatDay = (value: string) => dayToDate(value).toLocaleDateString(getDeviceLocaleTag(), { day: "numeric", month: "short" });

function Fact({ icon, label, value }: { icon: PixelIconName; label: string; value: string }) {
  const theme = usePixelTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
      <Chip icon={icon} size={1.5} />
      <T v="label">{label}</T>
      <T v="value" style={{ flex: 1, textAlign: "right" }} numberOfLines={2}>
        {value}
      </T>
    </View>
  );
}

/** What the goal measures, in one line. */
function target(goal: Goal): string {
  if (goal.alarm) return goal.alarm.targetTime;
  if (goal.appTimer) return t("pixel.goals.minutesPerDay", { app: goal.appTimer.appName, count: goal.appTimer.maxDailyMinutes });
  if (goal.location) return `${goal.location.placeLabel} · ${goal.location.arriveBy}`;
  return goal.ai?.verifier === "friend" ? t("form.ai.judgeFriend") : t("form.ai.judgeAi");
}

function CheckinRow({ checkin }: { checkin: Checkin }) {
  const theme = usePixelTheme();
  const icon: PixelIconName = checkin.result === "success" ? "check" : checkin.result === "fail" ? "close" : "hourglass";
  const measured = checkin.measuredValue === null ? "" : ` · ${checkin.measuredValue} ${t(`detail.units.${checkin.measuredUnit}`, { defaultValue: checkin.measuredUnit ?? "" })}`;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.em(0.55),
        paddingVertical: theme.em(0.4),
        paddingHorizontal: theme.em(0.5),
        borderWidth: theme.line,
        borderColor: theme.fg,
      }}
    >
      {checkin.result === "fail" ? <Hatch /> : null}
      <Chip icon={icon} size={1.5} solid={checkin.result === "success"} />
      <Main title={formatDay(checkin.scheduledFor)} note={`${t(`detail.results.${checkin.result}`)}${measured}`} />
      <T v="value">{formatClock(new Date(checkin.occurredAt))}</T>
    </View>
  );
}

export default function GoalDetailScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { state, dispatch, actions } = useAppStore();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const goal = state.goals.find((item) => item.id === activityId);
  const checkins = useApi(() => api.checkins(activityId));
  const proofs = useApi(() => (goal?.kind === "ai" ? api.proofs(activityId) : Promise.resolve([])));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [usedToday, setUsedToday] = useState<number | null>(null);

  const appPackage = goal?.appTimer?.appPackage;
  useEffect(() => {
    if (!appPackage || !hasUsageAccess()) return;
    usageOn(new Date()).then((usage) => setUsedToday(minutesFor(usage, appPackage)), () => {});
  }, [appPackage]);

  if (!goal) {
    return (
      <Screen onRefresh={actions.refresh}>
        <Notice tone="info">{state.sync === "loading" ? t("common.loading") : t("activity.notFound")}</Notice>
      </Screen>
    );
  }

  const live = goal.status === "active" || goal.status === "paused";
  const mine = goal.me?.role === "owner";
  const joined = goal.me?.status === "accepted";
  const days = weekdayLabels("short");
  const initials = weekdayLabels();
  const next = goal.status === "active" && joined ? nextOccurrence(goal, goal.alarm?.targetTime ?? goal.location?.arriveBy ?? "23:59") : null;

  /** Runs an action, showing its failure (or its success message) under the card. */
  const run = async (action: () => Promise<string | void>) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const text = await action();
      if (text) setMessage({ tone: "info", text });
      await checkins.reload();
    } catch (failure) {
      setMessage({ tone: "error", text: errorMessage(failure) });
    } finally {
      setBusy(false);
    }
  };

  const testAlarm = () =>
    run(async () => {
      if (await scheduleTestAlarm(goal, state.settings.vibration)) return t("detail.testScheduled");
      // No native module here (iOS, web): ring the in-app overlay only.
      dispatch({
        type: "alarm",
        alarm: { goalId: null, title: goal.title, time: goal.alarm!.targetTime, stake: goal.stakeAmount, total: 10, firedAt: Date.now(), phase: "ringing", test: true },
      });
    });

  const arrive = () =>
    run(async () => {
      try {
        const { checkin, goal: updated } = await checkInHere(goal);
        dispatch({ type: "goal", goal: updated });
        if (checkin.result === "success") dispatch({ type: "celebrate" });
        await actions.refresh();
        return t("detail.arrived", { distance: checkin.measuredValue ?? 0 });
      } catch (failure) {
        if (failure instanceof ApiError && failure.code === "TOO_FAR") {
          throw new Error(t("errors.TOO_FAR", { distance: failure.data.distance, radius: failure.data.radius }));
        }
        throw failure;
      }
    });

  const confirmCancel = () =>
    Alert.alert(t("detail.cancelTitle"), t("detail.cancelBody", { amount: goal.me?.stakeAmount ?? 0 }), [
      { text: t("common.no"), style: "cancel" },
      {
        text: t("detail.cancelConfirm"),
        style: "destructive",
        onPress: () =>
          run(async () => {
            await actions.cancelGoal(goal.id);
            router.back();
          }),
      },
    ]);

  return (
    <Screen onRefresh={() => Promise.all([actions.refresh(), checkins.reload(), proofs.reload()])}>
      <Card contentStyle={{ gap: theme.em(0.7) }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
          <Chip icon={GOAL_ICONS[goal.kind]} solid />
          <Main title={goal.title} note={`${t(`pixel.goals.kinds.${goal.kind}.detail`)} · ${t(`detail.status.${goal.status}`)}`} />
          {mine && live ? (
            <Toggle
              checked={goal.status === "active"}
              label={goal.title}
              onChange={() => run(async () => void (await actions.updateGoal(goal.id, { status: goal.status === "active" ? "paused" : "active" })))}
            />
          ) : null}
        </View>
        <T v="big" testID="goal-target" numberOfLines={2} adjustsFontSizeToFit>
          {target(goal)}
        </T>
        {goal.ai ? <T v="say">{`> ${goal.ai.prompt}`}</T> : null}
        <Fact icon="coin" label={t("pixel.goals.stake")} value={`${goal.stakeAmount} ${t("common.currency")}`} />
        <Fact icon="calendar" label={t("pixel.goals.days")} value={goal.repeatDays.map((day) => initials[day]).join(" ")} />
        <Fact icon="hourglass" label={t("detail.until")} value={formatDay(goal.endDate)} />
        <Fact icon="heart" label={t("detail.attemptsLeft")} value={`${goal.progress.attemptsLeft}/${goal.maxAttempts}`} />
        <Fact icon="check" label={t("detail.score")} value={`${goal.progress.successCount} ▲  ${goal.progress.failCount} ▼`} />
        {next ? <Fact icon="clock" label={t("detail.next")} value={`${days[next.getDay()]} ${formatClock(next)}`} /> : null}
        {goal.alarm ? <Fact icon="bolt" label={t("pixel.goals.reaction")} value={`${goal.alarm.reactionSeconds}s`} /> : null}
        {goal.location ? <Fact icon="pin" label={t("form.place.radius")} value={`${goal.location.radiusM} m`} /> : null}
        {usedToday !== null && goal.appTimer ? (
          <Fact icon="apps" label={t("detail.usedToday")} value={`${usedToday}/${goal.appTimer.maxDailyMinutes} min`} />
        ) : null}
        {mine && live ? (
          <Row>
            <T v="strong">{t("activity.notifications")}</T>
            <Toggle
              checked={goal.notificationsEnabled}
              label={t("activity.notifications")}
              onChange={() => run(async () => void (await actions.updateGoal(goal.id, { notificationsEnabled: !goal.notificationsEnabled })))}
            />
          </Row>
        ) : null}
      </Card>

      <EscrowCard goal={goal} />

      {goal.me?.status === "invited" ? (
        <Card solid>
          <T v="strong" color={theme.bg}>
            {t("detail.invited", { amount: goal.stakeAmount })}
          </T>
          <View style={{ flexDirection: "row", gap: theme.em(0.45) }}>
            <Btn testID="invite-accept" label={t("friendsScreen.accept")} icon="check" color={theme.bg} outside={theme.fg} style={{ flex: 1 }} onPress={() => run(() => actions.respondInvite(goal.id, true))} />
            <Btn
              testID="invite-decline"
              label={t("friendsScreen.decline")}
              variant="line"
              color={theme.bg}
              style={{ flex: 1 }}
              onPress={() => run(async () => {
                await actions.respondInvite(goal.id, false);
                router.back();
              })}
            />
          </View>
        </Card>
      ) : null}

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      {goal.status === "active" && joined ? (
        <>
          {goal.kind === "alarm" ? <Btn testID="goal-test-alarm" label={t("pixel.goals.testAlarm")} icon="play" disabled={busy} onPress={testAlarm} /> : null}
          {goal.kind === "appTimer" ? (
            <>
              <Btn testID="goal-focus" label={t("focus.focusSession")} icon="play" onPress={() => router.push(`/focus/${goal.id}`)} />
              {WillfolksNative && !hasUsageAccess() ? (
                <Btn label={t("perms.items.usage.title")} icon="apps" variant="line" onPress={() => WillfolksNative?.openUsageAccessSettings()} />
              ) : null}
            </>
          ) : null}
          {goal.kind === "locator" ? <Btn testID="goal-arrive" label={busy ? t("common.working") : t("detail.imHere")} icon="pin" disabled={busy} onPress={arrive} /> : null}
          {goal.kind === "ai" ? <Btn testID="goal-proof" label={t("detail.sendProof")} icon="eye" onPress={() => router.push(`/proof/${goal.id}`)} /> : null}
        </>
      ) : null}

      {goal.participants.length > 1 ? (
        <>
          <SectionTitle>{`${t("pixel.goals.participants")} · ${t(`form.mode.${goal.groupMode ?? "coop"}`)}`}</SectionTitle>
          <Card>
            {goal.participants.map((participant) => (
              <Row key={participant.userId}>
                <Main title={participant.user.displayName} note={t(`detail.participant.${participant.status}`)} />
                <T v="value">{`${participant.stakeAmount} ${t("common.currency")}`}</T>
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      {proofs.data?.length ? (
        <>
          <SectionTitle>{t("detail.proofs")}</SectionTitle>
          <View style={{ gap: theme.em(0.35) }}>
            {proofs.data.map((proof) => (
              <Card key={proof.id}>
                <Row>
                  <T v="strong">{t(`detail.proofStatus.${proof.status}`)}</T>
                  <T v="label">{formatClock(new Date(proof.createdAt))}</T>
                </Row>
                {proof.note ? <T v="say">{`> ${proof.note}`}</T> : null}
                {proof.verdictReason ? <T v="note">{proof.verdictReason}</T> : null}
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle>{t("detail.history")}</SectionTitle>
      {checkins.error ? <Notice>{checkins.error}</Notice> : null}
      {checkins.data?.length ? (
        <View style={{ gap: theme.em(0.35) }}>
          {checkins.data.map((checkin) => (
            <CheckinRow key={checkin.id} checkin={checkin} />
          ))}
        </View>
      ) : (
        <T v="note">{checkins.loading ? t("common.loading") : t("detail.noHistory")}</T>
      )}

      {goal.escrowTxHash && (!goal.escrow || goal.escrow.state === "none") ? (
        <Btn
          testID="escrow-receipt"
          label={t("chain.viewTx.createTx")}
          icon="arrow"
          variant="line"
          onPress={() => void Linking.openURL(explorerTx(undefined, goal.escrowTxHash!))}
        />
      ) : null}
      {mine && live ? <Btn testID="goal-cancel" label={t("detail.cancel")} icon="close" variant="line" disabled={busy} onPress={confirmCancel} /> : null}
    </Screen>
  );
}
