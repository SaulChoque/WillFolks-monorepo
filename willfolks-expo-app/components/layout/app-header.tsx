import { t } from "@/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SkiaGlassSurface } from "@/components/ui/skia-glass-surface";
import { AppColors } from "@/constants/theme";

export function AppHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: 12}]}>
      <SkiaGlassSurface
        borderRadius={22}
        style={styles.glassBackground}
        tintColor="rgba(132,204,22,0.34)"
        highlightColor="rgba(236,253,245,0.3)"
        strokeColor="rgba(190,242,100,0.4)"
      />
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("header.goToAccount")}
          style={styles.avatarButton}
          onPress={() => router.push("/account")}
        >
          <Text style={styles.avatarLabel}>S</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("header.comments")}
          style={styles.commentButton}
        >
          <MaterialIcons
            name="chat-bubble-outline"
            size={25}
            color={AppColors.lilac.iconStrong}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 12,
    marginTop: 30,
    borderRadius: 22,
    overflow: "hidden",
    paddingBottom: 12,
    paddingHorizontal: 18,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    transform: [{ scale: 1.02 }],
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.18)",
  },
  avatarLabel: {
    color: AppColors.lilac.iconStrong,
    fontSize: 22,
    fontWeight: "700",
    textTransform: "lowercase",
  },
  commentButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.12)",
  },
});
