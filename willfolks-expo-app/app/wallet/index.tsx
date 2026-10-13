import { useRouter } from "expo-router";
import { formatEther } from "ethers";
import { useEffect, useState } from "react";
import { Linking, Pressable, View } from "react-native";

import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Chip, Main, Notice, Row, SectionTitle, Segmented, Stepper, T } from "@/components/pixel/ui";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useApi } from "@/hooks/use-api";
import { t } from "@/i18n";
import { type ChainConfig, type ChainWallet, api } from "@/lib/api";
import { chainConfig, explorerAddress, explorerTx } from "@/lib/chain";
import { errorMessage } from "@/lib/errors";
import { INCOMING, TX_ICONS, formatMoment } from "@/lib/wallet";

export default function WalletScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { state, actions } = useAppStore();
  const history = useApi(api.transactions);
  const [amount, setAmount] = useState(20);
  const [method, setMethod] = useState<"crypto" | "fiat">("crypto");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const { available, inEscrow, penalized } = state.balance;
  const [chain, setChain] = useState<ChainConfig>({ enabled: false });
  const [chainWallet, setChainWallet] = useState<ChainWallet | null>(null);

  const loadChain = async () => {
    const config = await chainConfig().catch(() => ({ enabled: false }) as ChainConfig);
    setChain(config);
    if (config.enabled) setChainWallet(await api.chainWallet().catch(() => null));
  };
  useEffect(() => {
    void loadChain();
  }, []);

  const faucet = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const funded = await api.faucet();
      setMessage({ tone: "info", text: t("chain.faucetDone", { amount: funded.usdc }) });
      await Promise.all([loadChain(), actions.refresh(), history.reload()]);
    } catch (failure) {
      setMessage({ tone: "error", text: errorMessage(failure) });
    } finally {
      setBusy(false);
    }
  };

  const move = async (kind: "deposit" | "withdraw") => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const transaction = kind === "deposit" ? await actions.deposit(amount, method) : await actions.withdraw(amount);
      setMessage({ tone: "info", text: t(`walletScreen.done.${kind}`, { amount, reference: transaction.referenceCode }) });
      await history.reload();
    } catch (failure) {
      setMessage({ tone: "error", text: errorMessage(failure) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={() => Promise.all([actions.refresh(), history.reload()])}>
      <Card solid>
        <T v="label" color={theme.bg}>
          {t("walletScreen.available")}
        </T>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: theme.em(0.5) }}>
          <T v="big" color={theme.bg} testID="wallet-available">
            {available.toFixed(2)}
          </T>
          <T v="unit" color={theme.bg} style={{ marginBottom: theme.em(0.35) }}>
            USDC
          </T>
        </View>
        <Row>
          <T v="label" color={theme.bg}>{`◆ ${inEscrow.toFixed(2)} ${t("pixel.home.inEscrow")}`}</T>
          <T v="label" color={theme.bg}>{`▼ ${penalized.toFixed(2)} ${t("pixel.notes.locked")}`}</T>
        </Row>
      </Card>

      {chain.enabled ? (
        <Card>
          <T v="label">{t("chain.title", { network: chain.name })}</T>
          <T v="mono" selectable testID="chain-address">
            {chainWallet?.address ?? "—"}
          </T>
          <Row>
            <T v="label">{`${t("chain.usdc")}: ${(chainWallet?.usdc ?? 0).toFixed(2)}`}</T>
            <T v="label" testID="chain-gas">{`${t("chain.gas")}: ${Number(formatEther(BigInt(chainWallet?.native ?? "0"))).toFixed(3)}`}</T>
          </Row>
          <Btn testID="chain-faucet" label={busy ? t("common.working") : t("chain.faucet")} icon="coin" disabled={busy || !chainWallet?.address} onPress={faucet} />
          <T v="note">{t("chain.faucetBody")}</T>
          {chainWallet?.address ? (
            <Btn
              label={t("chain.explorer")}
              icon="arrow"
              variant="line"
              onPress={() => Linking.openURL(explorerAddress(chain, chainWallet.address!)!)}
            />
          ) : null}
        </Card>
      ) : (
      <Card>
        <Stepper testID="wallet-amount" label={t("walletScreen.amount")} value={amount} unit="USDC" step={5} min={5} max={500} onChange={setAmount} />
        <T v="label">{t("walletScreen.method")}</T>
        <Segmented
          testID="wallet-method"
          value={method}
          onChange={setMethod}
          options={[
            { value: "crypto", label: t("walletScreen.crypto") },
            { value: "fiat", label: t("walletScreen.fiat") },
          ]}
        />
        <View style={{ flexDirection: "row", gap: theme.em(0.45) }}>
          <Btn testID="wallet-deposit" label={t("walletScreen.deposit")} icon="coin" style={{ flex: 1 }} disabled={busy} onPress={() => move("deposit")} />
          <Btn
            testID="wallet-withdraw"
            label={t("walletScreen.withdraw")}
            icon="arrow"
            variant="line"
            style={[{ flex: 1 }, amount > available ? { opacity: 0.45 } : null]}
            disabled={busy || amount > available}
            onPress={() => move("withdraw")}
          />
        </View>
        <T v="note">{t("walletScreen.simulated")}</T>
      </Card>
      )}

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <SectionTitle>{t("walletScreen.history")}</SectionTitle>
      {history.error ? <Notice>{history.error}</Notice> : null}
      {history.data?.length ? (
        <View style={{ gap: theme.em(0.35) }}>
          {history.data.map((transaction) => {
            const incoming = INCOMING.includes(transaction.type);
            return (
              <Pressable
                key={transaction.id}
                testID={`tx-${transaction.type}`}
                accessibilityRole="button"
                onPress={() => router.push(`/wallet/${transaction.id}`)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.em(0.55),
                  paddingVertical: theme.em(0.45),
                  paddingHorizontal: theme.em(0.5),
                  borderWidth: theme.line,
                  borderColor: theme.fg,
                }}
              >
                <Chip icon={TX_ICONS[transaction.type]} solid={incoming} />
                <Main title={t(`walletScreen.types.${transaction.type}`)} note={`${formatMoment(transaction.createdAt)}${transaction.note ? ` · ${transaction.note}` : ""}`} />
                <T v="value">{`${incoming ? "+" : "−"}${transaction.amount}`}</T>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <T v="note">{history.loading ? t("common.loading") : t("walletScreen.empty")}</T>
      )}
    </Screen>
  );
}
