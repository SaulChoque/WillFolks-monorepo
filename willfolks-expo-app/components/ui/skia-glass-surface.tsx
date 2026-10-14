import {
    BlurMask,
    Canvas,
    LinearGradient,
    RoundedRect,
    vec,
} from "@shopify/react-native-skia";
import { PropsWithChildren, useState } from "react";
import {
    LayoutChangeEvent,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

interface SkiaGlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  tintColor?: string;
  highlightColor?: string;
  strokeColor?: string;
}

export function SkiaGlassSurface({
  children,
  style,
  borderRadius = 24,
  tintColor = "rgba(132,204,22,0.16)",
  highlightColor = "rgba(236, 253, 245, 0.4)",
  strokeColor = "rgba(190,242,100,0.24)",
}: PropsWithChildren<SkiaGlassSurfaceProps>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    if (size.width !== width || size.height !== height) {
      setSize({ width, height });
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[styles.container, { borderRadius }, style]}
    >
      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {size.width > 0 && size.height > 0 ? (
          <>
            <RoundedRect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              r={borderRadius}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(size.width, size.height)}
                colors={[highlightColor, tintColor]}
              />
            </RoundedRect>
            <RoundedRect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              r={borderRadius}
              color={highlightColor}
            >
              <BlurMask blur={30} style="inner" />
            </RoundedRect>
            <RoundedRect
              x={0.5}
              y={0.5}
              width={Math.max(size.width - 1, 0)}
              height={Math.max(size.height - 1, 0)}
              r={Math.max(borderRadius - 0.5, 0)}
              color={strokeColor}
              style="stroke"
              strokeWidth={1.25}
            />
          </>
        ) : null}
      </Canvas>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
