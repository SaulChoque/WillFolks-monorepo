import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { Btn, Field, Notice, T } from "@/components/pixel/ui";
import { OnboardingFrame } from "@/components/system/onboarding-frame";
import { useSession } from "@/hooks/use-session";
import { t } from "@/i18n";
import { API_URL, api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then(
      () => setOnline(true),
      () => setOnline(false),
    );
  }, []);

  const valid = EMAIL.test(email.trim());

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { isNew } = await signIn(email, name);
      // A returning, onboarded account is let through by the route guard on its own.
      if (isNew) router.replace("/onboarding/profile");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingFrame
      step={1}
      title={t("ob.signIn.title")}
      lead={t("ob.signIn.lead")}
      footer={
        <Btn
          testID="signin-submit"
          label={busy ? t("common.working") : t("ob.signIn.submit")}
          icon="arrow"
          size="xl"
          disabled={!valid || busy}
          style={!valid || busy ? { opacity: 0.45 } : undefined}
          onPress={submit}
        />
      }
    >
      <Field
        testID="signin-email"
        label={t("ob.signIn.email")}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
      />
      <Field
        testID="signin-name"
        label={t("ob.signIn.name")}
        hint={t("ob.signIn.nameHint")}
        value={name}
        onChangeText={setName}
        maxLength={60}
        autoComplete="name"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {error ? <Notice>{error}</Notice> : null}
      <T v="note" testID="signin-server">
        {online === null
          ? t("ob.signIn.serverChecking", { url: API_URL })
          : online
            ? t("ob.signIn.serverOnline", { url: API_URL })
            : t("ob.signIn.serverOffline", { url: API_URL })}
      </T>
      <T v="note">{t("ob.signIn.devNote")}</T>
    </OnboardingFrame>
  );
}
