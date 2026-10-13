import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { weekdayLabels } from "@/components/goals/day-picker";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Chamfer, Chip, Main, Notice, SectionTitle, T, Toggle, useHaptic } from "@/components/pixel/ui";
import type { PixelIconName } from "@/constants/pixel-icons";
import { GOAL_ICONS, Goal, useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";

function Fact({ icon, label, value }: { icon: PixelIconName; label: string; value: string }) {
  const theme = usePixelTheme();
  return (
    <View style={{ width: "50%", flexDirection: "row", alignItems: "center", gap: theme.em(0.45), paddingRight: theme.em(0.5) }}>
      <Chip icon={icon} size={1.4} />
      <View style={{ flex: 1 }}>
        <T v="label" style={{ fontSize: theme.em(0.54), lineHeight: theme.em(0.7) }}>
          {label}
        </T>
        <T v="button" style={{ letterSpacing: 0 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {value}
        </T>
      </View>
    </View>
  );
}

/** The one-line target under the goal's title. */
function detail(goal: Goal): string {
  if (goal.alarm) return goal.alarm.targetTime;
  if (goal.appTimer) return t("pixel.goals.minutesPerDay", { app: goal.appTimer.appName, count: goal.appTimer.maxDailyMinutes });
  if (goal.location) return `${goal.location.placeLabel} · ${goal.location.arriveBy}`;
  return t(`pixel.goals.kinds.${goal.kind}.detail`);
}

function GoalCard({ goal }: { goal: Goal }) {
  const router = useRouter();
  const theme = usePixelTheme();
  const { actions } = useAppStore();
  const active = goal.status === "active";
  const live = active || goal.status === "paused";
  const invited = goal.me?.status === "invited";
  const days = weekdayLabels();
  const state = invited ? t("detail.participant.invited") : t(`detail.status.${goal.status}`);

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
        <Chip icon={GOAL_ICONS[goal.kind]} solid />
        <Main title={goal.title} note={`${detail(goal)} · ${state}`} />
        {live && goal.me?.role === "owner" ? (
          <Toggle
            checked={active}
            label={goal.title}
            onChange={() => actions.updateGoal(goal.id, { status: active ? "paused" : "active" }).catch(() => {})}
          />
        ) : null}
      </View>

      <View style={[{ flexDirection: "row", flexWrap: "wrap", rowGap: theme.em(0.45) }, { opacity: active ? 1 : 0.45 }]}>
        <Fact icon="coin" label={t("pixel.goals.stake")} value={`${goal.stakeAmount} USDC`} />
        <Fact icon="heart" label={t("detail.attemptsLeft")} value={`${goal.progress.attemptsLeft}/${goal.maxAttempts}`} />
        <Fact icon="calendar" label={t("pixel.goals.days")} value={goal.repeatDays.map((day) => days[day]).join(" ")} />
        <Fact icon="check" label={t("detail.score")} value={`${goal.progress.successCount} ▲ ${goal.progress.failCount} ▼`} />
        {goal.isGroup ? (
          <Fact icon="group" label={t("pixel.goals.participants")} value={goal.participants.map((participant) => participant.user.displayName).join(", ")} />
        ) : null}
        {goal.devTipPercent > 0 ? <Fact icon="percent" label={t("pixel.goals.tip")} value={`${goal.devTipPercent}%`} /> : null}
      </View>

      <Btn
        testID={`goal-open-${goal.kind}`}
        label={invited ? t("detail.answer") : t("detail.open")}
        icon="arrow"
        size="sm"
        variant={invited ? "solid" : "line"}
        style={{ alignSelf: "flex-start" }}
        onPress={() => router.push(`/activity/${goal.id}`)}
      />
    </Card>
  );
}

export default function GoalsScreen() {
  const theme = usePixelTheme();
  const haptic = useHaptic();
  const { state, dispatch, actions } = useAppStore();
  const fab = theme.em(2.9);

  return (
    <View style={{ flex: 1 }}>
      <Screen style={{ paddingBottom: fab + theme.em(1.6) }} onRefresh={actions.refresh}>
        <SectionTitle>{t("pixel.goals.title")}</SectionTitle>
        {state.sync === "error" ? <Notice>{state.syncError}</Notice> : null}
        {state.goals.length === 0 && state.sync !== "error" ? (
          <T v="note" testID="goals-empty">
            {state.sync === "ready" ? t("pixel.goals.empty") : t("common.loading")}
          </T>
        ) : null}
        {state.goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </Screen>

      <Pressable
        testID="goals-add"
        accessibilityRole="button"
        accessibilityLabel={t("pixel.goals.add")}
        onPress={() => {
          haptic();
          dispatch({ type: "openSheet" });
        }}
        style={{ position: "absolute", right: theme.em(0.8), bottom: theme.em(0.9) }}
      >
        <Chamfer
          solid
          cut={theme.em(0.6)}
          contentStyle={{ width: fab, height: fab, alignItems: "center", justifyContent: "center" }}
        >
          <PixelIcon name="plus" size={theme.em(1.4)} color={theme.bg} />
        </Chamfer>
      </Pressable>
    </View>
  );
}
