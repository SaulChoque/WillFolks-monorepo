import { useState } from "react";

import { Btn, Card, Chip, Main, Notice, T } from "@/components/pixel/ui";
import { OnboardingFrame } from "@/components/system/onboarding-frame";
import { useSession } from "@/hooks/use-session";
import { useWalletSecurity } from "@/hooks/use-wallet-security";
import { t } from "@/i18n";
import { errorMessage } from "@/lib/errors";

export default function WalletSetupScreen() {
  const { updateProfile } = useSession();
  const { wallet, biometricAvailable, firstLaunchBiometricRequired, authenticateToReveal, lockSensitiveData } = useWalletSecurity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const secured = !firstLaunchBiometricRequired;

  const secure = async () => {
    setError(null);
    // Unlocking is only the proof of ownership here; the keys stay hidden.
    if (await authenticateToReveal()) lockSensitiveData();
  };

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // Completing onboarding flips the route guard, which swaps this flow for the app.
      await updateProfile({ onboardingCompleted: true });
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  };

  return (
    <OnboardingFrame
      step={4}
      title={t("ob.wallet.title")}
      lead={t("ob.wallet.lead")}
      footer={
        <>
          {biometricAvailable && !secured ? (
            <Btn testID="wallet-secure" label={t("ob.wallet.secure")} icon="lock" variant="line" onPress={secure} />
          ) : null}
          <Btn
            testID="wallet-finish"
            label={busy ? t("common.working") : secured ? t("ob.wallet.finish") : t("ob.wallet.skip")}
            icon="check"
            size="xl"
            disabled={busy}
            onPress={finish}
          />
        </>
      }
    >
      <Card>
        <T v="label">{t("pixel.settings.wallet")}</T>
        <T v="mono" selectable testID="wallet-address">
          {wallet?.address ?? t("pixel.settings.walletKeys.generating")}
        </T>
      </Card>
      <Card contentStyle={{ flexDirection: "row", alignItems: "center" }}>
        <Chip icon={secured ? "check" : "lock"} solid={secured} />
        <Main
          title={secured ? t("ob.wallet.securedTitle") : t("ob.wallet.biometricTitle")}
          note={biometricAvailable ? t("ob.wallet.biometricBody") : t("ob.wallet.noBiometric")}
        />
      </Card>
      {error ? <Notice>{error}</Notice> : null}
    </OnboardingFrame>
  );
}
