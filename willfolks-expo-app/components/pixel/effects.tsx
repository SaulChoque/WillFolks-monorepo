import { BlurMask, Canvas, Path, Rect, Skia } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";
import { T } from "./ui";

function useLayoutSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
  };
  return [size, onLayout] as const;
}

/** LCD pixel grid + vignette laid over the whole app. */
export function LcdOverlay() {
  const theme = usePixelTheme();
  const { width, height } = useWindowDimensions();
  const step = theme.em(0.2);

  const grid = useMemo(() => {
    const path = Skia.Path.Make();
    for (let x = 0; x <= width; x += step) {
      path.moveTo(x, 0);
      path.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += step) {
      path.moveTo(0, y);
      path.lineTo(width, y);
    }
    return path;
  }, [width, height, step]);

  // Mirrors `inset 0 0 2.5em`: a frame just outside the screen, blurred inwards.
  const sigma = theme.em(1.25);
  const frame = sigma * 4;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Path path={grid} style="stroke" strokeWidth={1} color={theme.fgA(0.05)} />
        <Rect
          x={-frame / 2}
          y={-frame / 2}
          width={width + frame}
          height={height + frame}
          style="stroke"
          strokeWidth={frame}
          color="rgba(0,0,0,0.3)"
        >
          <BlurMask blur={sigma} style="normal" />
        </Rect>
      </Canvas>
    </View>
  );
}

/** 135° hatch that marks a locked / lost block. */
export function Hatch({ color, alpha = 0.17 }: { color?: "fg" | "bg"; alpha?: number }) {
  const theme = usePixelTheme();
  const [size, onLayout] = useLayoutSize();
  const gap = theme.em(0.5);
  const stroke = theme.em(0.12);

  const path = useMemo(() => {
    const lines = Skia.Path.Make();
    for (let x = -size.height; x <= size.width; x += gap) {
      lines.moveTo(x, 0);
      lines.lineTo(x + size.height, size.height);
    }
    return lines;
  }, [size.width, size.height, gap]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {size.width > 0 ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Path
            path={path}
            style="stroke"
            strokeWidth={stroke}
            color={color === "bg" ? theme.bgA(alpha) : theme.fgA(alpha)}
          />
        </Canvas>
      ) : null}
    </View>
  );
}

/** A refresh bar that sweeps down the screen every time `trigger` changes. */
export function RefreshSweep({ trigger }: { trigger: string }) {
  const theme = usePixelTheme();
  const { height } = useWindowDimensions();
  const bar = height * 0.12;
  const y = useSharedValue(-bar);

  useEffect(() => {
    y.value = -bar;
    y.value = withTiming(height, { duration: 420, easing: Easing.linear });
  }, [trigger, bar, height, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, top: 0, height: bar }, style]}>
      <LinearGradient colors={[theme.fgA(0), theme.fgA(0.28)]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const BURST_PIECES = 22;

interface Piece {
  x: number;
  y: number;
  rotate: number;
}

function BurstPiece({ piece, progress, size }: { piece: Piece; progress: SharedValue<number>; size: number }) {
  const theme = usePixelTheme();
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // Pop in over the first eighth, then shrink away.
    const scale = p < 0.13 ? p / 0.13 : Math.max(0, 1 - (p - 0.13) / 0.87);
    return {
      transform: [
        { translateX: piece.x * p },
        { translateY: piece.y * p },
        { rotate: `${piece.rotate * p}deg` },
        { scale: p === 0 ? 0 : scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          margin: -size / 2,
          backgroundColor: theme.bg,
          borderWidth: theme.em(0.1),
          borderColor: theme.fg,
        },
        style,
      ]}
    />
  );
}

/** Celebration: a spray of pixels from the centre of the screen. */
export function Burst() {
  const theme = usePixelTheme();
  const { state } = useAppStore();
  const progress = useSharedValue(0);
  const unit = theme.em(1);

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: BURST_PIECES }, () => ({
        x: (Math.random() * 2 - 1) * unit * 8,
        y: (Math.random() * 260 - 190) * (unit / 16),
        rotate: Math.random() * 360 - 180,
      })),
    // A fresh spray for every celebration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.celebrate, unit],
  );

  useEffect(() => {
    if (state.celebrate === 0) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.exp) }, () => {
      progress.value = 0;
    });
  }, [state.celebrate, progress]);

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: "56%", left: "50%" }}>
      {pieces.map((piece, index) => (
        <BurstPiece key={index} piece={piece} progress={progress} size={theme.em(0.5)} />
      ))}
    </View>
  );
}

/** Confirmation toast, only when a stake has just been locked. */
export function LockedToast() {
  const theme = usePixelTheme();
  const { state } = useAppStore();
  const opacity = useSharedValue(0);
  const lift = useSharedValue(12);

  useEffect(() => {
    if (state.locked === 0) return;
    lift.value = 12;
    lift.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.exp) });
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(1400, withTiming(0, { duration: 200 })),
    );
  }, [state.locked, lift, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: lift.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: 0, right: 0, bottom: theme.em(7.4), alignItems: "center" }, style]}
    >
      <View style={{ backgroundColor: theme.fg, paddingVertical: theme.em(0.34), paddingHorizontal: theme.em(0.56) }}>
        <T v="h2" color={theme.bg}>{`>> ${t("pixel.toast")}`}</T>
      </View>
    </Animated.View>
  );
}
