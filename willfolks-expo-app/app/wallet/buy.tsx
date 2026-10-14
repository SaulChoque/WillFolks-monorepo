import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, View, useWindowDimensions } from "react-native";

import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Notice, Row, SectionTitle, Stepper, T } from "@/components/pixel/ui";
import { BankQr } from "@/components/wallet/bank-qr";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";
import { type QrPurchase, type QrTerms, type Transaction, api } from "@/lib/api";
import { explorerTx } from "@/lib/chain";
import { errorMessage } from "@/lib/errors";

/** How often the screen asks whether the bank already paid the QR. */
const POLL_MS = 4_000;

const bs = (value: number) => `Bs ${value.toFixed(2)}`;

function Line({ label, value, testID }: { label: string; value: string; testID?: string }) {
  const theme = usePixelTheme();
  return (
    <Row style={{ paddingTop: theme.em(0.35), borderTopWidth: theme.line, borderColor: theme.fg }}>
      <T v="label">{label}</T>
      <T v="value" testID={testID}>
        {value}
      </T>
    </Row>
  );
}

/** mm:ss left until `iso`. */
function useCountdown(iso: string | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!iso) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [iso]);
  const left = iso ? Math.max(0, new Date(iso).getTime() - now) : 0;
  const seconds = Math.floor(left / 1000);
  return { left, label: `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}` };
}

/** Buy USDC with a Bolivian bank QR: pick the amount, pay the QR from any bank app, receive the USDC. */
export default function BuyWithQrScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { width } = useWindowDimensions();
  const { actions } = useAppStore();
  const [terms, setTerms] = useState<QrTerms | null>(null);
  const [usdc, setUsdc] = useState(1);
  const [purchase, setPurchase] = useState<QrPurchase | null>(null);
  const [paid, setPaid] = useState<Transaction | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef(false);
  const countdown = useCountdown(purchase && !paid ? purchase.expiresAt : undefined);

  useEffect(() => {
    api
      .qrTerms()
      .then((loaded) => {
        setTerms(loaded);
        setUsdc((value) => Math.min(Math.max(value, loaded.minUsdc), loaded.maxUsdc));
      })
      .catch((failure) => setError(errorMessage(failure)));
  }, []);

  const rate = purchase?.bobPerUsd ?? terms?.bobPerUsd ?? 0;

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setExpired(false);
    try {
      setPurchase(await api.buyWithQr(usdc));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const check = useCallback(
    async (manual = false) => {
      if (!purchase || paid || inflight.current) return;
      inflight.current = true;
      if (manual) setChecking(true);
      try {
        const answer = await api.confirmQr(purchase.ticket);
        if (answer.status === "paid") {
          setPaid(answer.transaction);
          void actions.refresh();
        } else if (answer.status === "expired") {
          setExpired(true);
        } else if (manual) {
          setError(t("buyQr.notYet"));
        }
      } catch (failure) {
        if (manual) setError(errorMessage(failure));
      } finally {
        inflight.current = false;
        if (manual) setChecking(false);
      }
    },
    [purchase, paid, actions],
  );

  // The bank pays outside the app: keep asking while the QR is on screen.
  useEffect(() => {
    if (!purchase || paid || expired) return;
    const timer = setInterval(() => void check(), POLL_MS);
    return () => clearInterval(timer);
  }, [purchase, paid, expired, check]);

  useEffect(() => {
    if (purchase && !paid && countdown.left === 0) setExpired(true);
  }, [purchase, paid, countdown.left]);

  const reset = () => {
    setPurchase(null);
    setPaid(null);
    setExpired(false);
    setError(null);
  };

  if (paid && purchase) {
    return (
      <Screen>
        <SectionTitle>{t("buyQr.doneTitle")}</SectionTitle>
        <Card solid>
          <T v="label" color={theme.bg}>
            {t("buyQr.received")}
          </T>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: theme.em(0.5) }}>
            <T v="big" color={theme.bg} testID="buy-received">
              {`+${paid.amount.toFixed(2)}`}
            </T>
            <T v="unit" color={theme.bg} style={{ marginBottom: theme.em(0.35) }}>
              USDC
            </T>
          </View>
          <T v="note" color={theme.bg}>
            {t("buyQr.doneBody", { bob: bs(purchase.bob), reference: paid.referenceCode })}
          </T>
        </Card>
        {paid.txHash ? (
          <Btn testID="buy-receipt" label={t("chain.viewReceipt")} icon="arrow" variant="line" onPress={() => Linking.openURL(explorerTx(undefined, paid.txHash!))} />
        ) : null}
        <Btn testID="buy-back" label={t("buyQr.back")} icon="check" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (purchase) {
    const plate = Math.min(width - theme.em(2), theme.em(17));
    return (
      <Screen>
        <SectionTitle>{t("buyQr.scanTitle")}</SectionTitle>
        <BankQr modules={purchase.modules} image={purchase.image} size={plate} caption={`QR · ${bs(purchase.bob)}`} />
        <Card>
          <Line label={t("buyQr.youPay")} value={bs(purchase.bob)} testID="buy-bob" />
          <Line label={t("buyQr.youGet")} value={`${purchase.usdc.toFixed(2)} USDC`} />
          <Line label={t("buyQr.rate")} value={`1 USD = ${bs(rate)}`} />
          <Line label={t("buyQr.qrId")} value={purchase.id} testID="buy-qr-id" />
          <Line label={t("buyQr.expires")} value={expired ? t("buyQr.expired") : countdown.label} />
        </Card>
        {expired ? (
          <>
            <Notice>{t("buyQr.expiredBody")}</Notice>
            <Btn testID="buy-again" label={t("buyQr.again")} icon="coin" onPress={reset} />
          </>
        ) : (
          <>
            <Notice tone="info">{checking ? t("buyQr.checking") : t("buyQr.waiting")}</Notice>
            <Btn testID="buy-check" label={checking ? t("common.working") : t("buyQr.paid")} icon="check" disabled={checking} onPress={() => void check(true)} />
            <T v="note">{t("buyQr.hint")}</T>
          </>
        )}
        {error ? <Notice>{error}</Notice> : null}
        <Btn testID="buy-cancel" label={t("common.cancel")} variant="line" onPress={reset} />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle>{t("buyQr.title")}</SectionTitle>
      <Card>
        <T v="note">{t("buyQr.intro")}</T>
        <Stepper
          testID="buy-amount"
          label={t("buyQr.amount")}
          value={usdc}
          unit="USDC"
          step={1}
          min={terms?.minUsdc ?? 1}
          max={terms?.maxUsdc ?? 10}
          onChange={setUsdc}
        />
        <Line label={t("buyQr.youPay")} value={terms ? bs(Math.round(usdc * rate * 100) / 100) : "—"} testID="buy-quote" />
        <Line label={t("buyQr.rate")} value={terms ? `1 USD = ${bs(rate)}` : "—"} />
      </Card>
      {terms && !terms.enabled ? <Notice>{t("buyQr.unavailable")}</Notice> : null}
      {error ? <Notice>{error}</Notice> : null}
      <Btn
        testID="buy-generate"
        label={busy ? t("common.working") : t("buyQr.generate")}
        icon="coin"
        disabled={busy || !terms?.enabled}
        onPress={generate}
      />
      <T v="note">{t("buyQr.banks")}</T>
    </Screen>
  );
}
