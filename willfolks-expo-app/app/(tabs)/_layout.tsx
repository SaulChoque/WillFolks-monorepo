import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { SkiaGlassSurface } from "@/components/ui/skia-glass-surface";
import { AppColors } from "@/constants/theme";
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
        <SkiaGlassSurface
          borderRadius={39}
          style={styles.centerButtonGlass}
          tintColor={AppColors.limeGlass.tintStrong}
          highlightColor={AppColors.limeGlass.highlightStrong}
          strokeColor={AppColors.limeGlass.strokeStrong}
        />
        <View style={styles.centerButtonInner}>
          <MaterialIcons
            name={"mood" as never}
            size={30}
            color={isActive ? AppColors.lilac.iconStrong : AppColors.lilac.icon}
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.lilac.iconStrong,
        tabBarInactiveTintColor: AppColors.lilac.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => (
          <SkiaGlassSurface
            borderRadius={20}
            style={StyleSheet.absoluteFill}
            tintColor="rgba(131, 204, 22, 0.62)"
            highlightColor="rgba(236, 253, 245, 0.58)"
            strokeColor="rgba(190, 242, 100, 0.58)"

          />
        ),
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
    height: 72,
    margin: 10,
    borderRadius: 20,
    borderTopWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItem: {
    marginTop: 9,
  },
  centerButtonWrapper: {
    top: -18,
    justifyContent: "center",
    alignItems: "center",
  },
  centerButtonOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  centerButtonGlass: {
    ...StyleSheet.absoluteFillObject,
  },
  centerButtonOuterActive: {
    transform: [{ scale: 1.02 }],
  },
  centerButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
