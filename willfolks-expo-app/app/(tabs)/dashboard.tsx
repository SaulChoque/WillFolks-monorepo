import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { Hatch } from "@/components/pixel/effects";
import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Chip, Main, Notice, Row, SectionTitle, T } from "@/components/pixel/ui";
import { FeedItem, useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useSession } from "@/hooks/use-session";
import { t } from "@/i18n";

const METER_CELLS = 12;
/** USDC each meter cell stands for. */
const METER_STEP = 2.5;

function feedNote(item: FeedItem): string {
  switch (item.tone) {
    case "lost":
      return item.amount > 0 ? `▼ −${item.amount} USDC · ${t("pixel.notes.locked")}` : `▼ ${t("pixel.notes.missed")}`;
    case "won":
      return item.amount > 0
        ? `▲ +${item.amount} USDC · ${t("pixel.notes.won")}`
        : `▲ ${t("pixel.notes.safe")}`;
    case "staked":
      return `◆ ${item.amount} USDC · ${t("pixel.notes.staked")}`;
    default:
      return `● 0 USDC · ${t("pixel.notes.onTrack")}`;
  }
}

/** Terminal-style cursor after the user's name. */
function Cursor() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setOn((current) => !current), 550);
    return () => clearInterval(timer);
  }, []);
  return <T v="h1" style={{ opacity: on ? 1 : 0 }}>_</T>;
}

export default function DashboardScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { state, actions } = useAppStore();
  const { user } = useSession();
  const { inEscrow, available } = state.balance;
  const litCells = Math.min(METER_CELLS, Math.round(inEscrow / METER_STEP));

  return (
    <Screen onRefresh={actions.refresh}>
      <View style={{ gap: theme.em(0.15) }}>
        <T v="label">{t("pixel.home.welcome")}</T>
        <View style={{ flexDirection: "row" }}>
          <T v="h1" testID="home-name">
            {user?.displayName ?? ""}
          </T>
          <Cursor />
        </View>
      </View>

      {state.sync === "error" ? <Notice>{state.syncError}</Notice> : null}

      <Card solid>
        <T v="label" color={theme.bg}>
          {t("pixel.home.inEscrow")}
        </T>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: theme.em(0.5) }}>
          <T v="big" color={theme.bg} testID="home-escrow">
            {inEscrow.toFixed(2)}
          </T>
          <T v="unit" color={theme.bg} style={{ marginBottom: theme.em(0.35) }}>
            USDC
          </T>
        </View>
        <View style={{ flexDirection: "row", gap: theme.em(0.15), height: theme.em(0.55) }}>
          {Array.from({ length: METER_CELLS }, (_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                borderWidth: theme.em(0.07),
                borderColor: theme.bg,
                backgroundColor: index < litCells ? theme.bg : "transparent",
              }}
            />
          ))}
        </View>
        <Row>
          <T v="label" color={theme.bg}>
            {t("pixel.home.activeGoals", { count: state.activeGoals })}
          </T>
          <T v="label" color={theme.bg} testID="home-available">{`▲ ${available.toFixed(2)} ${t("pixel.home.available")}`}</T>
        </Row>
      </Card>

      <View style={{ flexDirection: "row", gap: theme.em(0.45) }}>
        <Btn testID="home-wallet" label={t("pixel.screens.wallet")} icon="wallet" style={{ flex: 1 }} onPress={() => router.push("/wallet")} />
        <Btn testID="home-friends" label={t("pixel.screens.friends")} icon="group" variant="line" style={{ flex: 1 }} onPress={() => router.push("/friends")} />
      </View>

      <SectionTitle>{t("pixel.home.recent")}</SectionTitle>
      {state.feed.length === 0 ? <T v="note">{state.sync === "loading" ? t("common.loading") : t("pixel.home.empty")}</T> : null}
      <View style={{ gap: theme.em(0.35) }}>
        {state.feed.slice(0, 6).map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            disabled={!item.goalId}
            onPress={() => item.goalId && router.push(`/activity/${item.goalId}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.em(0.55),
              paddingVertical: theme.em(0.45),
              paddingHorizontal: theme.em(0.5),
              borderWidth: theme.line,
              borderColor: theme.fg,
            }}
          >
            {item.tone === "lost" ? <Hatch /> : null}
            <Chip icon={item.icon} />
            <Main title={item.title} note={feedNote(item)} />
            <T v="value">{item.value}</T>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
