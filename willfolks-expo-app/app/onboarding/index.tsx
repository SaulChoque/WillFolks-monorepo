import { Redirect, useRouter } from "expo-router";
import { View } from "react-native";

import { PetBitmap } from "@/components/pixel/pixel-icon";
import { Btn, Card, Chip, Main } from "@/components/pixel/ui";
import { OnboardingFrame } from "@/components/system/onboarding-frame";
import type { PixelIconName } from "@/constants/pixel-icons";
import { usePixelTheme } from "@/hooks/use-app-store";
import { useSession } from "@/hooks/use-session";
import { t } from "@/i18n";

const POINTS: { id: string; icon: PixelIconName }[] = [
  { id: "stake", icon: "coin" },
  { id: "prove", icon: "check" },
  { id: "lose", icon: "lock" },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { status } = useSession();

  // Signed in but not done: pick the flow up where the account stands.
  if (status === "signedIn") return <Redirect href="/onboarding/profile" />;

  return (
    <OnboardingFrame
      step={0}
      title="WillFolks"
      lead={`> ${t("ob.welcome.lead")}`}
      footer={<Btn testID="welcome-start" label={t("ob.welcome.start")} icon="arrow" size="xl" onPress={() => router.push("/onboarding/sign-in")} />}
    >
      <View style={{ alignItems: "center", paddingVertical: theme.em(0.6) }}>
        <PetBitmap mood="happy" width={theme.em(8)} color={theme.fg} />
      </View>
      <Card contentStyle={{ gap: theme.em(0.7) }}>
        {POINTS.map((point) => (
          <View key={point.id} style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
            <Chip icon={point.icon} solid />
            <Main title={t(`ob.welcome.points.${point.id}.title`)} note={t(`ob.welcome.points.${point.id}.body`)} />
          </View>
        ))}
      </Card>
    </OnboardingFrame>
  );
}
