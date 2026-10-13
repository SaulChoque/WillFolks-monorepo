import { Canvas, Circle, Path, Skia } from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { PetBitmap, PixelIcon } from "@/components/pixel/pixel-icon";
import { Screen } from "@/components/pixel/screen";
import { Btn, Card, T } from "@/components/pixel/ui";
import type { PetMood } from "@/constants/pet-sprite";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";

/** Energy as a ring around the mood icon. */
function EnergyRing({ value, sad }: { value: number; sad: boolean }) {
  const theme = usePixelTheme();
  const size = theme.em(2.3);
  const stroke = theme.em(0.3);
  const radius = (size - stroke) / 2;

  const arc = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc({ x: stroke / 2, y: stroke / 2, width: size - stroke, height: size - stroke }, -90, (360 * value) / 100);
    return path;
  }, [size, stroke, value]);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Canvas style={{ position: "absolute", width: size, height: size }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} style="stroke" strokeWidth={stroke} color={theme.fgA(0.22)} />
        <Path path={arc} style="stroke" strokeWidth={stroke} color={theme.fg} />
      </Canvas>
      <PixelIcon name={sad ? "eye" : "smile"} size={theme.em(1.05)} color={theme.fg} />
    </View>
  );
}

/** The WillPet: blinks on its own while idle. */
function Pet({ mood, width }: { mood: PetMood; width: number }) {
  const theme = usePixelTheme();
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (mood !== "idle") return;
    let closeTimer: ReturnType<typeof setTimeout>;
    const openTimer = setInterval(() => {
      setBlinking(true);
      closeTimer = setTimeout(() => setBlinking(false), 160);
    }, 2900);
    return () => {
      clearInterval(openTimer);
      clearTimeout(closeTimer);
      setBlinking(false);
    };
  }, [mood]);

  return <PetBitmap mood={mood === "idle" && blinking ? "blink" : mood} width={width} color={theme.fg} />;
}

export default function PetScreen() {
  const theme = usePixelTheme();
  const { state, actions } = useAppStore();
  const { mood, energy, streak, name } = state.pet;
  const [stageWidth, setStageWidth] = useState(0);
  const bob = useSharedValue(0);
  const hop = useSharedValue(0);
  const squash = useSharedValue(1);

  // Idle bob in two hard steps, like a sprite sheet.
  useEffect(() => {
    const lift = -theme.em(0.25);
    bob.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 450, easing: Easing.steps(1) }),
        withTiming(lift, { duration: 450, easing: Easing.steps(1) }),
      ),
      -1,
    );
    return () => cancelAnimation(bob);
  }, [bob, theme]);

  // A happy pet hops, then settles back to its resting face.
  useEffect(() => {
    if (mood !== "happy") return;
    const step = { duration: 190, easing: Easing.out(Easing.quad) };
    hop.value = withSequence(
      withTiming(-theme.em(1.4), step),
      withTiming(0, step),
      withTiming(-theme.em(0.6), step),
      withTiming(0, step),
    );
    squash.value = withSequence(
      withTiming(1.08, step),
      withTiming(0.9, step),
      withTiming(1.03, step),
      withTiming(1, step),
    );
    const rest = setTimeout(actions.petRest, 1500);
    return () => clearTimeout(rest);
  }, [mood, state.celebrate, actions, hop, squash, theme]);

  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const hopStyle = useAnimatedStyle(() => ({
    transformOrigin: "50% 100%",
    transform: [{ translateY: hop.value }, { scaleY: squash.value }],
  }));

  const line = mood === "sad" ? "sad" : mood === "happy" ? "happy" : energy > 85 ? "full" : "idle";
  const onStageLayout = ({ nativeEvent }: LayoutChangeEvent) => setStageWidth(nativeEvent.layout.width);

  return (
    <Screen fixed>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
        <EnergyRing value={energy} sad={mood === "sad"} />
        <View>
          <T v="label">{t("pixel.pet.mood")}</T>
          <T v="stat" testID="pet-energy">{`${energy}%`}</T>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.45), marginLeft: "auto" }}>
          <PixelIcon name="flame" size={theme.em(1.4)} color={theme.fg} />
          <View>
            <T v="label">{t("pixel.pet.streak")}</T>
            <T v="stat">{t("pixel.pet.days", { count: streak })}</T>
          </View>
        </View>
      </View>

      <Card style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
        <T v="label">{`${t("pixel.pet.title")} · ${name}`}</T>
        <T v="say" style={{ minHeight: theme.em(2) }}>{`> ${t(`pixel.pet.lines.${line}`)}`}</T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("pixel.pet.poke")}
          onPress={() => actions.petAction("poke")}
          onLayout={onStageLayout}
          style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}
        >
          <Animated.View style={bobStyle}>
            <Animated.View style={hopStyle}>
              {stageWidth > 0 ? <Pet mood={mood} width={stageWidth * 0.64} /> : null}
            </Animated.View>
          </Animated.View>
          <View style={{ width: "88%", marginTop: theme.em(0.15), gap: theme.em(0.2) }}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={{ height: theme.em(0.1), backgroundColor: theme.fg }} />
            ))}
          </View>
        </Pressable>
      </Card>

      <View style={{ flexDirection: "row", gap: theme.em(0.45) }}>
        <Btn
          label={t("pixel.pet.feed")}
          icon="heart"
          style={{ flex: 1 }}
          testID="pet-feed"
          onPress={() => actions.petAction("feed")}
        />
        <Btn
          label={t("pixel.pet.play")}
          icon="play"
          variant="line"
          style={{ flex: 1 }}
          testID="pet-play"
          onPress={() => actions.petAction("play")}
        />
      </View>
    </Screen>
  );
}
