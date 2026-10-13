import { useFocusEffect } from "expo-router";
import { PropsWithChildren, useCallback, useState } from "react";
import { KeyboardAvoidingView, RefreshControl, ScrollView, StyleProp, View, ViewStyle } from "react-native";

import { usePixelTheme } from "@/hooks/use-app-store";
import { Stagger } from "./ui";

/** A counter that bumps every time the screen gains focus. */
export function useFocusCount() {
  const [count, setCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setCount((current) => current + 1);
    }, []),
  );
  return count;
}

interface ScreenProps extends PropsWithChildren {
  /** Fixed-height layout instead of a scroll view. */
  fixed?: boolean;
  /** Enables pull-to-refresh. */
  onRefresh?: () => Promise<unknown>;
  style?: StyleProp<ViewStyle>;
}

/** Screen body: themed background, LCD spacing and a stepped entrance on focus. */
export function Screen({ fixed, onRefresh, style, children }: ScreenProps) {
  const theme = usePixelTheme();
  const focusCount = useFocusCount();
  const [refreshing, setRefreshing] = useState(false);
  const layout: ViewStyle = {
    gap: theme.em(0.6),
    paddingTop: theme.em(0.8),
    paddingHorizontal: theme.em(0.8),
    paddingBottom: theme.em(1.15),
  };

  if (fixed) {
    return <View style={[{ flex: 1, backgroundColor: theme.bg }, layout, style]}>{children}</View>;
  }

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[layout, style]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.bg]} progressBackgroundColor={theme.fg} tintColor={theme.fg} />
          ) : undefined
        }
      >
        <Stagger replayKey={focusCount}>{children}</Stagger>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
