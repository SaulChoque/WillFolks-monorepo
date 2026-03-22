import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { t } from "@/i18n";

function CenterTabButton({
  onPress,
  accessibilityState,
}: BottomTabBarButtonProps) {
  const isActive = Boolean(accessibilityState?.selected);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.centerButtonWrapper}
    >
      <View
        style={[
          styles.centerButtonOuter,
          isActive && styles.centerButtonOuterActive,
        ]}
      >
        <View style={styles.centerButtonInner}>
          <MaterialIcons
            name={"mood" as never}
            size={30}
            color={isActive ? "#2563eb" : "#4f46e5"}
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.background,
        tabBarInactiveTintColor: "rgba(255,255,255,0.55)",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("navigation.time"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="access-time" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("navigation.dashboard"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home-filled" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: t("navigation.home3d"),
          tabBarButton: (props) => <CenterTabButton {...props} />,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: t("navigation.activities"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="grid-view" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("navigation.settings"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    height: 66,
    borderRadius: 20,
    borderTopWidth: 0,
    backgroundColor: "#0f0f10",
    paddingHorizontal: 12,
  },
  centerButtonWrapper: {
    top: -24,
    justifyContent: "center",
    alignItems: "center",
  },
  centerButtonOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#d4d4d8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#f4f4f5",
  },
  centerButtonOuterActive: {
    transform: [{ scale: 1.02 }],
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f4f4f5",
    justifyContent: "center",
    alignItems: "center",
  },
});
