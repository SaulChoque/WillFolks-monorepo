import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "@/constants/theme";
import { DaySelection } from "@/types/home";

interface DaySelectorProps {
  days: DaySelection[];
  onToggleDay?: (id: string) => void;
}

export const DaySelector = memo(function DaySelector({
  days,
  onToggleDay,
}: DaySelectorProps) {
  const Wrapper = onToggleDay ? Pressable : View;

  return (
    <View style={styles.container}>
      {days.map((day, index) => {
        const isLast = index === days.length - 1;
        return (
          <Wrapper
            key={day.id}
            style={[
              styles.day,
              day.isActive ? styles.active : styles.inactive,
              !isLast && styles.daySpacing,
            ]}
            accessibilityRole={onToggleDay ? "button" : undefined}
            accessibilityState={{ selected: day.isActive }}
            onPress={onToggleDay ? () => onToggleDay(day.id) : undefined}
          >
            <Text
              style={[
                styles.label,
                day.isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              {day.label}
            </Text>
          </Wrapper>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  day: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  daySpacing: {
    marginRight: 10,
  },
  active: {
    backgroundColor: AppColors.lilac.switchOn,
  },
  inactive: {
    backgroundColor: AppColors.lilac.chip,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeLabel: {
    color: "#ffffff",
  },
  inactiveLabel: {
    color: AppColors.lilac.textSecondary,
  },
});
