import * as Haptics from "expo-haptics";
import { Children, PropsWithChildren, ReactNode, useEffect } from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { PixelIconName } from "@/constants/pixel-icons";
import { PixelFonts } from "@/constants/theme";
import { PixelTheme, useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { PixelIcon } from "./pixel-icon";

/** Light tap feedback that respects the Haptic feedback setting. */
export function useHaptic() {
  const { state } = useAppStore();
  const enabled = state.settings.haptics;
  return () => {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
}

// ---------- type ----------

export type TextVariant =
  | "label"
  | "h1"
  | "h1sm"
  | "h2"
  | "big"
  | "unit"
  | "strong"
  | "note"
  | "value"
  | "valueLg"
  | "stat"
  | "say"
  | "button"
  | "clock"
  | "mono";

function mono(theme: PixelTheme, size: number, family: string, spacing: number): TextStyle {
  const fontSize = theme.em(size);
  return {
    fontFamily: family,
    fontSize,
    lineHeight: Math.round(fontSize * 1.3),
    letterSpacing: fontSize * spacing,
    textTransform: "uppercase",
  };
}

function pixel(theme: PixelTheme, size: number, uppercase = true): TextStyle {
  const fontSize = theme.em(size);
  return {
    fontFamily: PixelFonts.pixel,
    fontSize,
    // VT323 sits low in its box; a tight line keeps the LCD rhythm.
    lineHeight: Math.round(fontSize * 0.92),
    textTransform: uppercase ? "uppercase" : "none",
  };
}

export function textStyle(theme: PixelTheme, variant: TextVariant): TextStyle {
  switch (variant) {
    case "label":
      return { ...mono(theme, 0.62, PixelFonts.mono, 0.08), opacity: 0.85 };
    case "h1":
      return { ...pixel(theme, 2), letterSpacing: theme.em(0.04) };
    case "h1sm":
      return { ...pixel(theme, 1.5), letterSpacing: theme.em(0.03) };
    case "h2":
      return mono(theme, 0.62, PixelFonts.monoBold, 0.08);
    case "big":
      return pixel(theme, 2.9);
    case "unit":
      return mono(theme, 0.58, PixelFonts.monoBold, 0.08);
    case "strong":
      return { ...mono(theme, 0.74, PixelFonts.monoBlack, 0.02), lineHeight: Math.round(theme.em(0.74) * 1.2) };
    case "note":
      return { ...mono(theme, 0.6, PixelFonts.mono, 0.05), opacity: 0.88 };
    case "value":
      return pixel(theme, 1.25);
    case "valueLg":
      return pixel(theme, 1.7);
    case "stat":
      return pixel(theme, 1.3);
    case "say":
      return pixel(theme, 1.05, false);
    case "button":
      return mono(theme, 0.68, PixelFonts.monoBlack, 0.06);
    case "clock":
      return { ...pixel(theme, 4.3), letterSpacing: theme.em(0.09), fontVariant: ["tabular-nums"] };
    case "mono":
      return { ...pixel(theme, 1.15, false), letterSpacing: theme.em(0.05) };
  }
}

interface TProps extends TextProps {
  v?: TextVariant;
  color?: string;
}

export function T({ v = "strong", color, style, ...rest }: TProps) {
  const theme = usePixelTheme();
  return (
    <Text
      allowFontScaling={false}
      {...rest}
      style={[{ color: color ?? theme.fg, includeFontPadding: false }, textStyle(theme, v), style]}
    />
  );
}

// ---------- blocks ----------

interface CornerCutProps {
  corner: "tl" | "br";
  /** Length of the cut along each edge. */
  size: number;
  color: string;
}

/** A diamond centred on a corner: it hides (or strokes) a 45° chamfer. */
function CornerCut({ corner, size, color }: CornerCutProps) {
  const side = size * Math.SQRT2;
  const offset = -side / 2;
  return (
    <View
      pointerEvents="none"
      style={[
        { position: "absolute", width: side, height: side, backgroundColor: color, transform: [{ rotate: "45deg" }] },
        corner === "tl" ? { left: offset, top: offset } : { right: offset, bottom: offset },
      ]}
    />
  );
}

interface ChamferProps extends PropsWithChildren {
  /** Filled with ink instead of outlined. */
  solid?: boolean;
  cut: number;
  /** Colour behind the block, used to carve the corners. */
  outside?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Block with the top-left and bottom-right corners cut, like the landing cards. */
export function Chamfer({ solid, cut, outside, style, contentStyle, children }: ChamferProps) {
  const theme = usePixelTheme();
  const carve = outside ?? theme.bg;
  return (
    <View style={[{ backgroundColor: theme.fg, padding: solid ? 0 : theme.line, overflow: "hidden" }, style]}>
      <View style={[{ backgroundColor: solid ? theme.fg : theme.bg }, contentStyle]}>{children}</View>
      {solid ? null : (
        <>
          <CornerCut corner="tl" size={cut + theme.line * Math.SQRT2} color={theme.fg} />
          <CornerCut corner="br" size={cut + theme.line * Math.SQRT2} color={theme.fg} />
        </>
      )}
      <CornerCut corner="tl" size={cut} color={carve} />
      <CornerCut corner="br" size={cut} color={carve} />
    </View>
  );
}

interface CardProps extends PropsWithChildren {
  solid?: boolean;
  /** Colour behind the card, when it is not the screen background. */
  outside?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Card({ solid, outside, style, contentStyle, children }: CardProps) {
  const theme = usePixelTheme();
  return (
    <Chamfer
      solid={solid}
      outside={outside}
      cut={theme.em(0.6)}
      style={style}
      contentStyle={[
        { paddingVertical: theme.em(0.7), paddingHorizontal: theme.em(0.75), gap: theme.em(0.45) },
        contentStyle,
      ]}
    >
      {children}
    </Chamfer>
  );
}

/** Uppercase section title followed by a dotted rule. */
export function SectionTitle({ children }: PropsWithChildren) {
  const theme = usePixelTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.7) }}>
      <T v="h2">{children}</T>
      <View
        style={{
          flex: 1,
          borderBottomWidth: theme.em(0.12),
          borderStyle: "dotted",
          borderColor: theme.fg,
          opacity: 0.55,
        }}
      />
    </View>
  );
}

interface ChipProps {
  icon: PixelIconName;
  solid?: boolean;
  /** Box side in ems. */
  size?: number;
  color?: string;
}

export function Chip({ icon, solid, size = 1.75, color }: ChipProps) {
  const theme = usePixelTheme();
  const ink = color ?? theme.fg;
  const side = theme.em(size);
  return (
    <View
      style={{
        width: side,
        height: side,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: solid ? ink : "transparent",
        borderWidth: solid ? 0 : theme.line,
        borderColor: ink,
      }}
    >
      <PixelIcon name={icon} size={side * 0.57} color={solid ? theme.bg : ink} />
    </View>
  );
}

/** Title + note column used by list rows, goal headers and settings. */
export function Main({ title, note, color }: { title: string; note?: string; color?: string }) {
  const theme = usePixelTheme();
  return (
    <View style={{ flex: 1, minWidth: 0, gap: theme.em(0.12) }}>
      <T v="strong" numberOfLines={1} color={color}>
        {title}
      </T>
      {note ? (
        <T v="note" color={color}>
          {note}
        </T>
      ) : null}
    </View>
  );
}

export function Row({ style, children }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = usePixelTheme();
  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.em(0.5) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ---------- controls ----------

interface BtnProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  icon?: PixelIconName;
  variant?: "solid" | "line";
  size?: "sm" | "md" | "xl";
  /** Ink colour; defaults to the theme foreground. */
  color?: string;
  /** Colour behind the button (carves the chamfer). */
  outside?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Btn({
  label,
  icon,
  variant = "solid",
  size = "md",
  color,
  outside,
  style,
  onPress,
  disabled,
  children,
  ...rest
}: BtnProps) {
  const theme = usePixelTheme();
  const haptic = useHaptic();
  const ink = color ?? theme.fg;
  const paper = outside ?? theme.bg;
  const isLine = variant === "line";
  // The outline is part of the box, so line buttons give it back in padding.
  const border = isLine ? theme.em(size === "xl" ? 0.2 : 0.11) : 0;
  const padV = theme.em(size === "sm" ? 0.42 : size === "xl" ? 0.95 : 0.6) - border;
  const padH = theme.em(size === "sm" ? 0.62 : 0.5);
  const content = isLine ? ink : paper;
  const cut = theme.em(0.48);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={(event) => {
        haptic();
        onPress?.(event);
      }}
      style={({ pressed }) => [
        {
          overflow: "hidden",
          backgroundColor: isLine ? "transparent" : ink,
          borderWidth: border,
          borderColor: ink,
          opacity: disabled ? 0.8 : 1,
          transform: [{ translateY: pressed ? theme.em(0.1) : 0 }],
        },
        style,
      ]}
      {...rest}
    >
      {children}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.em(0.42),
          paddingVertical: padV,
          paddingHorizontal: padH,
        }}
      >
        {icon ? <PixelIcon name={icon} size={theme.em(size === "xl" ? 1.1 : 0.88)} color={content} /> : null}
        <T v="button" color={content} style={size === "xl" ? { fontSize: theme.em(0.9) } : undefined}>
          {label}
        </T>
      </View>
      {isLine ? null : (
        <>
          <CornerCut corner="tl" size={cut} color={paper} />
          <CornerCut corner="br" size={cut} color={paper} />
        </>
      )}
    </Pressable>
  );
}

interface ToggleProps {
  checked: boolean;
  label: string;
  onChange: () => void;
}

export function Toggle({ checked, label, onChange }: ToggleProps) {
  const theme = usePixelTheme();
  const haptic = useHaptic();
  const progress = useSharedValue(checked ? 1 : 0);
  const travel = theme.em(1.04);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, { duration: 180 });
  }, [checked, progress]);

  const knob = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ translateX: progress.value * travel }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={theme.em(0.5)}
      onPress={() => {
        haptic();
        onChange();
      }}
      style={{
        width: theme.em(2.3),
        height: theme.em(1.25),
        padding: theme.em(0.17),
        borderWidth: theme.line,
        borderColor: theme.fg,
      }}
    >
      <Animated.View style={[{ width: theme.em(0.84), flex: 1, backgroundColor: theme.fg }, knob]} />
    </Pressable>
  );
}

// ---------- forms ----------

interface FieldProps extends TextInputProps {
  label: string;
  hint?: string;
}

/** Labelled text input in the LCD style. */
export function Field({ label, hint, style, ...rest }: FieldProps) {
  const theme = usePixelTheme();
  return (
    <View style={{ gap: theme.em(0.25) }}>
      <T v="label">{label}</T>
      <TextInput
        allowFontScaling={false}
        accessibilityLabel={label}
        placeholderTextColor={theme.fgA(0.45)}
        selectionColor={theme.fgA(0.35)}
        cursorColor={theme.fg}
        {...rest}
        style={[
          {
            borderWidth: theme.line,
            borderColor: theme.fg,
            color: theme.fg,
            paddingVertical: theme.em(0.4),
            paddingHorizontal: theme.em(0.55),
            fontFamily: PixelFonts.pixel,
            fontSize: theme.em(1.15),
            includeFontPadding: false,
          },
          style,
        ]}
      />
      {hint ? <T v="note">{hint}</T> : null}
    </View>
  );
}

interface PickerFieldProps {
  label: string;
  value: string;
  icon?: PixelIconName;
  onPress: () => void;
  testID?: string;
}

/** Looks like a Field, but opens a picker instead of the keyboard. */
export function PickerField({ label, value, icon = "arrow", onPress, testID }: PickerFieldProps) {
  const theme = usePixelTheme();
  const haptic = useHaptic();
  return (
    <View style={{ gap: theme.em(0.25) }}>
      <T v="label">{label}</T>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={() => {
          haptic();
          onPress();
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.em(0.5),
          borderWidth: theme.line,
          borderColor: theme.fg,
          paddingVertical: theme.em(0.4),
          paddingHorizontal: theme.em(0.55),
        }}
      >
        <T v="mono" style={{ flex: 1 }} numberOfLines={1}>
          {value}
        </T>
        <PixelIcon name={icon} size={theme.em(0.9)} color={theme.fg} />
      </Pressable>
    </View>
  );
}

interface SegmentedProps<Value extends string> {
  options: { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  testID?: string;
}

/** A row of mutually exclusive choices; the picked one is inked. */
export function Segmented<Value extends string>({ options, value, onChange, testID }: SegmentedProps<Value>) {
  const theme = usePixelTheme();
  const haptic = useHaptic();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: "row", borderWidth: theme.line, borderColor: theme.fg }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            testID={testID ? `${testID}-${option.value}` : undefined}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              haptic();
              onChange(option.value);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: theme.em(0.5),
              backgroundColor: selected ? theme.fg : "transparent",
            }}
          >
            <T v="button" color={selected ? theme.bg : theme.fg}>
              {option.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

interface StepperProps {
  label: string;
  value: number;
  unit?: string;
  step?: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  testID?: string;
}

/** − value + control for small numbers (minutes, metres, attempts, stake). */
export function Stepper({ label, value, unit, step = 1, min, max, onChange, testID }: StepperProps) {
  const theme = usePixelTheme();
  const haptic = useHaptic();
  const button = (sign: string, delta: number, side: "Right" | "Left") => (
    <Pressable
      testID={testID ? `${testID}-${delta > 0 ? "more" : "less"}` : undefined}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${sign}`}
      onPress={() => {
        haptic();
        onChange(Math.min(max, Math.max(min, value + delta)));
      }}
      style={({ pressed }) => ({
        width: theme.em(2.4),
        alignSelf: "stretch",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? theme.fg : "transparent",
        [`border${side}Width`]: theme.line,
        borderColor: theme.fg,
      })}
    >
      {({ pressed }) => (
        <T v="h1sm" color={pressed ? theme.bg : theme.fg}>
          {sign}
        </T>
      )}
    </Pressable>
  );

  return (
    <View style={{ gap: theme.em(0.25) }}>
      <T v="label">{label}</T>
      <View style={{ flexDirection: "row", alignItems: "center", borderWidth: theme.line, borderColor: theme.fg }}>
        {button("−", -step, "Right")}
        <View
          accessibilityLiveRegion="polite"
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: theme.em(0.4),
            paddingVertical: theme.em(0.3),
          }}
        >
          <T v="valueLg">{value}</T>
          {unit ? (
            <T v="unit" style={{ marginBottom: theme.em(0.25) }}>
              {unit}
            </T>
          ) : null}
        </View>
        {button("+", step, "Left")}
      </View>
    </View>
  );
}

/** Inline message: an error (▼) or a neutral note (●). */
export function Notice({ tone = "error", children }: PropsWithChildren<{ tone?: "error" | "info" }>) {
  const theme = usePixelTheme();
  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : undefined}
      accessibilityLiveRegion="polite"
      style={{ borderWidth: theme.line, borderColor: theme.fg, borderStyle: "dashed", padding: theme.em(0.5) }}
    >
      <T v="h2" style={{ lineHeight: theme.em(0.95) }}>{`${tone === "error" ? "▼" : "●"} ${children}`}</T>
    </View>
  );
}

// ---------- motion ----------

interface StaggerProps extends PropsWithChildren {
  /** Changing the key replays the entrance. */
  replayKey?: number | string;
}

/** Steps each direct child in, one after another, like an LCD repaint. */
export function Stagger({ replayKey, children }: StaggerProps) {
  return (
    <>
      {Children.toArray(children).map((child, index) => (
        <Animated.View key={`${replayKey}-${index}`} entering={FadeInDown.duration(260).delay(index * 45)}>
          {child}
        </Animated.View>
      ))}
    </>
  );
}
