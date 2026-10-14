import { Pressable, View } from "react-native";

import { T, useHaptic } from "@/components/pixel/ui";
import { usePixelTheme } from "@/hooks/use-app-store";
import { getDeviceLocaleTag } from "@/i18n";

/** Narrow weekday names in the device language, Sunday first (2023-01-01 was a Sunday). */
export function weekdayLabels(format: "narrow" | "short" = "narrow"): string[] {
  const formatter = new Intl.DateTimeFormat(getDeviceLocaleTag(), { weekday: format });
  return Array.from({ length: 7 }, (_, day) => formatter.format(new Date(2023, 0, 1 + day)));
}

interface DayPickerProps {
  /** Selected week days, 0 = Sunday. */
  value: number[];
  onChange: (value: number[]) => void;
}

/** Seven toggles, one per week day. At least one always stays on. */
export function DayPicker({ value, onChange }: DayPickerProps) {
  const theme = usePixelTheme();
  const haptic = useHaptic();
  const names = weekdayLabels("short");

  return (
    <View style={{ flexDirection: "row", gap: theme.em(0.25) }}>
      {weekdayLabels().map((label, day) => {
        const selected = value.includes(day);
        return (
          <Pressable
            key={day}
            testID={`day-${day}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={names[day]}
            onPress={() => {
              const next = selected ? value.filter((item) => item !== day) : [...value, day].sort();
              if (!next.length) return;
              haptic();
              onChange(next);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: theme.em(0.45),
              borderWidth: theme.line,
              borderColor: theme.fg,
              backgroundColor: selected ? theme.fg : "transparent",
            }}
          >
            <T v="button" color={selected ? theme.bg : theme.fg}>
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
