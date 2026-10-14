import { useRouter } from "expo-router";

import { Btn } from "@/components/pixel/ui";
import { OnboardingFrame } from "@/components/system/onboarding-frame";
import { PermissionsList } from "@/components/system/permissions-list";
import { t } from "@/i18n";

export default function PermissionsSetupScreen() {
  const router = useRouter();
  return (
    <OnboardingFrame
      step={3}
      title={t("perms.title")}
      lead={t("perms.lead")}
      footer={<Btn testID="permissions-continue" label={t("common.continue")} icon="arrow" size="xl" onPress={() => router.push("/onboarding/wallet")} />}
    >
      <PermissionsList />
    </OnboardingFrame>
  );
}
