import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/ui/card";
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
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <Card style={styles.modalCard}>
          <Text style={styles.title}>{t("biometricModal.title")}</Text>
          <Text style={styles.description}>
            {t("biometricModal.description")}
          </Text>

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          <Pressable
            style={[
              styles.button,
              (isAuthenticating || !biometricAvailable) &&
                styles.buttonDisabled,
            ]}
            disabled={isAuthenticating || !biometricAvailable}
            onPress={onAuthenticate}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                {t("biometricModal.authenticate")}
              </Text>
            )}
          </Pressable>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,15,16,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(17,17,17,0.7)",
    lineHeight: 21,
  },
  error: {
    marginTop: 12,
    fontSize: 13,
    color: "#111111",
  },
  button: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
