import { Image } from "expo-image";
import { View } from "react-native";

import { T } from "@/components/pixel/ui";
import { usePixelTheme } from "@/hooks/use-app-store";
import { mediaUrl } from "@/lib/api";

interface AvatarProps {
  name: string;
  /** Server path or local file URI. */
  uri?: string | null;
  /** Side in ems. */
  size?: number;
}

/** Square avatar: the photo if there is one, otherwise the initial on ink. */
export function Avatar({ name, uri, size = 2.4 }: AvatarProps) {
  const theme = usePixelTheme();
  const side = theme.em(size);
  const source = uri?.startsWith("/") ? mediaUrl(uri) : uri;
  return (
    <View
      style={{
        width: side,
        height: side,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.fg,
        borderWidth: theme.line,
        borderColor: theme.fg,
        overflow: "hidden",
      }}
    >
      {source ? (
        <Image source={{ uri: source }} style={{ width: side, height: side }} contentFit="cover" accessibilityIgnoresInvertColors />
      ) : (
        <T v={size >= 2 ? "stat" : "strong"} color={theme.bg}>
          {(name.trim().charAt(0) || "?").toUpperCase()}
        </T>
      )}
    </View>
  );
}
