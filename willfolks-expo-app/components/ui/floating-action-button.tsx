import { PropsWithChildren } from "react";
import {
    GestureResponderEvent,
    Pressable,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

import { SkiaGlassSurface } from "@/components/ui/skia-glass-surface";
import { AppColors } from "@/constants/theme";

interface FloatingActionButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
}

export function FloatingActionButton({
  children,
  style,
  onPress,
}: PropsWithChildren<FloatingActionButtonProps>) {
  return (
    <Pressable
      style={({ pressed }) => [styles.base, style, pressed && styles.pressed]}
      onPress={onPress}
    >
      <SkiaGlassSurface
        borderRadius={32}
        style={styles.glassSurface}
        tintColor={AppColors.limeGlass.tintStrong}
        highlightColor={AppColors.limeGlass.highlightStrong}
        strokeColor={AppColors.limeGlass.strokeStrong}
      />
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 14,
  },
  glassSurface: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
