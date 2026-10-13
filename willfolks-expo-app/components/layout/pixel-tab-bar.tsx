import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PixelIcon } from "@/components/pixel/pixel-icon";
import { useHaptic } from "@/components/pixel/ui";
import type { PixelIconName } from "@/constants/pixel-icons";
import { usePixelTheme } from "@/hooks/use-app-store";

const TAB_ICONS: Record<string, PixelIconName> = {
  index: "clock",
  dashboard: "home",
  home: "smile",
  activities: "grid",
  settings: "gear",
};

/** The raised, outlined centre tab. */
const PET_ROUTE = "home";

export function PixelTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = usePixelTheme();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  // The pet tab is taller than its row, so it pokes out above the rule.
  const raise = theme.em(0.3);

  return (
    <View style={{ backgroundColor: theme.bg }}>
      {/* The rule starts below the part of the pet tab that pokes out. */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 0, right: 0, top: raise, height: theme.line, backgroundColor: theme.fg }}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: theme.em(0.25),
          paddingHorizontal: theme.em(0.6),
          paddingBottom: Math.max(insets.bottom, theme.em(0.75)),
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const isPet = route.name === PET_ROUTE;
          const { options } = descriptors[route.key];

          const onPress = () => {
            haptic();
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.title}
              onPress={onPress}
              style={{
                flex: 1,
                height: theme.em(isPet ? 3.2 : 2.5),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused ? theme.fg : theme.bg,
                borderWidth: isPet ? theme.line : 0,
                borderColor: theme.fg,
              }}
            >
              <PixelIcon
                name={TAB_ICONS[route.name] ?? "grid"}
                size={theme.em(isPet ? 1.5 : 1.15)}
                color={focused ? theme.bg : theme.fg}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
