import { t } from "@/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AppHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
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
          <MaterialIcons name="chat-bubble-outline" size={25} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#000000",
    paddingBottom: 12,
    paddingHorizontal: 18,
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
    backgroundColor: "#0a73c9",
  },
  avatarLabel: {
    color: "#cdeaff",
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
  },
});
