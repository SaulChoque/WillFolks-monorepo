import { PropsWithChildren, ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T } from "@/components/pixel/ui";
import { usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";

const STEPS = 4;

interface OnboardingFrameProps extends PropsWithChildren {
  /** 1-based step, or 0 for the welcome screen (no progress bar). */
  step: number;
  title: string;
  lead?: string;
  /** Buttons pinned under the scrolling content. */
  footer: ReactNode;
}

/** Shared chrome of the onboarding screens: progress, title, body and pinned actions. */
export function OnboardingFrame({ step, title, lead, footer, children }: OnboardingFrameProps) {
  const theme = usePixelTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + theme.em(0.8) }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: theme.em(0.7), paddingHorizontal: theme.em(0.9), paddingBottom: theme.em(1) }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step > 0 ? (
          <View style={{ gap: theme.em(0.35) }}>
            <T v="label">{t("ob.step", { step, total: STEPS })}</T>
            <View style={{ flexDirection: "row", gap: theme.em(0.2), height: theme.em(0.4) }}>
              {Array.from({ length: STEPS }, (_, index) => (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    borderWidth: theme.em(0.07),
                    borderColor: theme.fg,
                    backgroundColor: index < step ? theme.fg : "transparent",
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}
        <T v="h1" accessibilityRole="header">
          {title}
        </T>
        {lead ? <T v="say">{lead}</T> : null}
        {children}
      </ScrollView>
      {/* The bottom inset lives here: KeyboardAvoidingView overrides its own paddingBottom. */}
      <View
        style={{
          gap: theme.em(0.45),
          paddingHorizontal: theme.em(0.9),
          paddingTop: theme.em(0.5),
          paddingBottom: Math.max(insets.bottom, theme.em(0.6)) + theme.em(0.4),
        }}
      >
        {footer}
      </View>
    </KeyboardAvoidingView>
  );
}
