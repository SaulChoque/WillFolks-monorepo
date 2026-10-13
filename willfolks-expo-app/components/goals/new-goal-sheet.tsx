import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PixelIcon } from "@/components/pixel/pixel-icon";
import { Btn, Row, T, useHaptic } from "@/components/pixel/ui";
import { GOAL_ICONS, GoalKind, useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";

const GOAL_KINDS: GoalKind[] = ["alarm", "appTimer", "locator", "ai"];

/** Bottom sheet that starts a new goal: pick the kind and the amount, then fill in the details. */
export function NewGoalSheet() {
  const router = useRouter();
  const theme = usePixelTheme();
  const haptic = useHaptic();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { state, dispatch } = useAppStore();
  const sheet = state.sheet;
  const open = sheet !== null;
  const rise = useSharedValue(height);

  // Only replay when the sheet opens, not on every stake/kind change.
  useEffect(() => {
    if (!open) return;
    rise.value = height;
    rise.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.exp) });
  }, [open, height, rise]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: rise.value }] }));

  if (!sheet) return null;

  const close = () => dispatch({ type: "closeSheet" });
  const stepper = (label: string, sign: string, delta: number, side: "left" | "right") => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic();
        dispatch({ type: "sheetStake", delta });
      }}
      style={({ pressed }) => ({
        width: theme.em(2.9),
        alignSelf: "stretch",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? theme.fg : "transparent",
        [side === "left" ? "borderRightWidth" : "borderLeftWidth"]: theme.line,
        borderColor: theme.fg,
      })}
    >
      {({ pressed }) => (
        <T v="h1" color={pressed ? theme.bg : theme.fg}>
          {sign}
        </T>
      )}
    </Pressable>
  );

  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("pixel.sheet.cancel")}
        onPress={close}
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.bgA(0.72) }]}
      />
      <Animated.View
        style={[
          {
            gap: theme.em(0.55),
            paddingTop: theme.em(0.9),
            paddingHorizontal: theme.em(0.85),
            paddingBottom: Math.max(insets.bottom, theme.em(0.4)) + theme.em(0.6),
            borderTopWidth: theme.em(0.16),
            borderColor: theme.fg,
            backgroundColor: theme.bg,
          },
          panelStyle,
        ]}
      >
        <Row>
          <T v="h1sm">{t("pixel.sheet.title")}</T>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("pixel.sheet.cancel")}
            hitSlop={theme.em(0.5)}
            onPress={close}
            style={{
              width: theme.em(1.9),
              height: theme.em(1.9),
              alignItems: "center",
              justifyContent: "center",
              borderWidth: theme.line,
              borderColor: theme.fg,
            }}
          >
            <PixelIcon name="close" size={theme.em(1)} color={theme.fg} />
          </Pressable>
        </Row>

        <T v="label">{t("pixel.sheet.pick")}</T>
        <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: theme.em(0.35) }}>
          {GOAL_KINDS.map((kind) => {
            const selected = sheet.kind === kind;
            const ink = selected ? theme.bg : theme.fg;
            return (
              <Pressable
                key={kind}
                testID={`sheet-kind-${kind}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  haptic();
                  dispatch({ type: "sheetKind", kind });
                }}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: theme.em(0.4),
                  paddingTop: theme.em(0.65),
                  paddingBottom: theme.em(0.55),
                  borderWidth: theme.line,
                  borderColor: theme.fg,
                  backgroundColor: selected ? theme.fg : "transparent",
                }}
              >
                <PixelIcon name={GOAL_ICONS[kind]} size={theme.em(1.3)} color={ink} />
                <T v="button" color={ink} style={{ fontSize: theme.em(0.56) }}>
                  {t(`pixel.goals.kinds.${kind}.short`)}
                </T>
              </Pressable>
            );
          })}
        </View>

        <T v="label">{t("pixel.sheet.stake")}</T>
        <View style={{ flexDirection: "row", alignItems: "center", borderWidth: theme.line, borderColor: theme.fg }}>
          {stepper(t("pixel.sheet.less"), "−", -1, "left")}
          <View
            accessibilityLiveRegion="polite"
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: theme.em(0.5),
              paddingVertical: theme.em(0.2),
            }}
          >
            <T v="big">{sheet.stake}</T>
            <T v="unit" style={{ marginBottom: theme.em(0.35) }}>
              USDC
            </T>
          </View>
          {stepper(t("pixel.sheet.more"), "+", 1, "right")}
        </View>

        <T v="label">{t("pixel.sheet.available", { amount: state.balance.available.toFixed(2) })}</T>
        <T v="h2">{`▼ ${t("pixel.sheet.ifMiss")}`}</T>
        <Btn
          testID="sheet-next"
          label={t("pixel.sheet.next")}
          icon="arrow"
          onPress={() => {
            close();
            router.push({ pathname: "/activity/new", params: { kind: sheet.kind, stake: String(sheet.stake) } });
          }}
        />
      </Animated.View>
    </View>
  );
}
