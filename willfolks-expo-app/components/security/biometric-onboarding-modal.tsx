import { ActivityIndicator, Modal, View } from "react-native";

import { Btn, Card, T } from "@/components/pixel/ui";
import { usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";

interface BiometricOnboardingModalProps {
  visible: boolean;
  isAuthenticating: boolean;
  biometricAvailable: boolean;
  errorMessage: string | null;
  onAuthenticate: () => void;
}

export function BiometricOnboardingModal({
  visible,
  isAuthenticating,
  biometricAvailable,
  errorMessage,
  onAuthenticate,
}: BiometricOnboardingModalProps) {
  const theme = usePixelTheme();
  const disabled = isAuthenticating || !biometricAvailable;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: theme.em(0.8),
          backgroundColor: theme.bgA(0.88),
        }}
      >
        <Card outside={theme.bg} contentStyle={{ gap: theme.em(0.6), paddingVertical: theme.em(0.9) }}>
          <T v="h1sm">{t("biometricModal.title")}</T>
          <T v="note">{t("biometricModal.description")}</T>
          {errorMessage ? <T v="h2">{`▼ ${errorMessage}`}</T> : null}
          {isAuthenticating ? (
            <ActivityIndicator color={theme.fg} />
          ) : (
            <Btn
              label={t("biometricModal.authenticate")}
              icon="lock"
              disabled={disabled}
              style={disabled ? { opacity: 0.45 } : undefined}
              onPress={onAuthenticate}
            />
          )}
        </Card>
      </View>
    </Modal>
  );
}
