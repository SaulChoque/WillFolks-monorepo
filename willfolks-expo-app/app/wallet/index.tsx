import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, View } from "react-native";

import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Chip, Main, Notice, Row, SectionTitle, Segmented, Stepper, T } from "@/components/pixel/ui";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useApi } from "@/hooks/use-api";
import { t } from "@/i18n";
import { type ChainConfig, type ChainWallet, type SmartAccountInfo, api } from "@/lib/api";
import { chainConfig, explorerAddress, explorerTx } from "@/lib/chain";
import { errorMessage } from "@/lib/errors";
import { createSmartAccount } from "@/lib/smart-account";
import { INCOMING, TX_ICONS, displayNote, formatMoment } from "@/lib/wallet";

export default function WalletScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { state, actions } = useAppStore();
  const history = useApi(api.transactions);
  const [amount, setAmount] = useState(20);
  const [method, setMethod] = useState<"crypto" | "fiat">("crypto");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string; txHash?: string | null } | null>(null);
  const { available, inEscrow, penalized } = state.balance;
  const [chain, setChain] = useState<ChainConfig>({ enabled: false });
  const [chainWallet, setChainWallet] = useState<ChainWallet | null>(null);
  const [smart, setSmart] = useState<SmartAccountInfo | null>(null);

  const loadChain = async () => {
    const config = await chainConfig().catch(() => ({ enabled: false }) as ChainConfig);
    setChain(config);
    if (config.enabled) {
      setChainWallet(await api.chainWallet().catch(() => null));
      setSmart(await api.smartAccount().catch(() => null));
    }
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
      setMessage({ tone: "info", text: t("chain.faucetDone", { amount: funded.usdc }), txHash: funded.usdcTx });
      await Promise.all([loadChain(), actions.refresh(), history.reload()]);
    } catch (failure) {
      setMessage({ tone: "error", text: errorMessage(failure) });
    } finally {
      setBusy(false);
    }
  };

  /** Fiat deposit with the chain on: the backend pays the balance to the account. The amount comes from the backend. */
  const depositAmount = chain.enabled ? (chain.fiatDepositUsdc ?? 1) : 1;
  const depositFiat = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const deposited = await actions.deposit(depositAmount, "fiat");
      setMessage({ tone: "info", text: t("chain.depositDone", { amount: depositAmount }), txHash: deposited.txHash });
      await Promise.all([loadChain(), actions.refresh(), history.reload()]);
    } catch (failure) {
      setMessage({ tone: "error", text: errorMessage(failure) });
    } finally {
      setBusy(false);
    }
  };

  const openSmartAccount = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await createSmartAccount();
      setMessage({ tone: "info", text: t("chain.scaReady") });
      await loadChain();
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
      setMessage({ tone: "info", text: t(`walletScreen.done.${kind}`, { amount, reference: transaction.referenceCode }), txHash: transaction.txHash });
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
            {t("common.currency")}
          </T>
        </View>
        <Row>
          <T v="label" color={theme.bg}>{`◆ ${inEscrow.toFixed(2)} ${t("pixel.home.inEscrow")}`}</T>
          <T v="label" color={theme.bg}>{`▼ ${penalized.toFixed(2)} ${t("pixel.notes.locked")}`}</T>
        </Row>
      </Card>

      {chain.enabled ? (
        <Card>
          <T v="label">{t("chain.title")}</T>
          <T v="strong" testID="chain-usdc">{`${(chainWallet?.usdc ?? 0).toFixed(2)} ${t("common.currency")}`}</T>
          <Btn testID="chain-faucet" label={busy ? t("common.working") : t("chain.faucet")} icon="coin" disabled={busy || !chainWallet?.address} onPress={faucet} />
          <T v="note">{t("chain.faucetBody")}</T>
          <Btn testID="chain-deposit-fiat" label={busy ? t("common.working") : t("chain.depositFiat", { amount: depositAmount })} icon="coin" variant="line" disabled={busy || !chainWallet?.address} onPress={depositFiat} />
          <T v="note">{t("chain.depositFiatBody")}</T>
          {chainWallet?.address ? (
            <Btn
              label={t("chain.explorer")}
              icon="arrow"
              variant="line"
              onPress={() => Linking.openURL(explorerAddress(chain, chainWallet.address!))}
            />
          ) : null}
        </Card>
      ) : (
      <Card>
        <Stepper testID="wallet-amount" label={t("walletScreen.amount")} value={amount} unit={t("common.currency")} step={5} min={5} max={500} onChange={setAmount} />
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

      {chain.enabled && smart?.enabled ? (
        <Card>
          <T v="label">{t("chain.sca")}</T>
          <T v="strong" testID="sca-address">
            {smart.account ? t("chain.scaReady") : t("chain.scaNone")}
          </T>
          <T v="note">{t("chain.scaBody")}</T>
          {smart.account ? (
            <Btn
              testID="sca-explorer"
              label={t("chain.scaView")}
              icon="arrow"
              variant="line"
              onPress={() => Linking.openURL(explorerAddress(chain, smart.account!.address))}
            />
          ) : (
            <Btn testID="sca-create" label={busy ? t("common.working") : t("chain.scaCreate")} icon="spark" variant="line" disabled={busy || !chainWallet?.address} onPress={openSmartAccount} />
          )}
        </Card>
      ) : null}

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      {message?.txHash ? (
        <Btn
          testID="tx-explorer"
          label={t("chain.viewReceipt")}
          icon="arrow"
          variant="line"
          onPress={() => Linking.openURL(explorerTx(chain, message.txHash!))}
        />
      ) : null}

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
                <Main title={t(`walletScreen.types.${transaction.type}`)} note={`${formatMoment(transaction.createdAt)}${displayNote(transaction.note) ? ` · ${displayNote(transaction.note)}` : ""}`} />
                <T v="value">{`${incoming ? "+" : "−"}${transaction.amount}`}</T>
                {transaction.txHash ? (
                  <Pressable
                    testID={`tx-link-${transaction.id}`}
                    accessibilityRole="link"
                    accessibilityLabel={t("chain.linkA11y")}
                    hitSlop={8}
                    onPress={() => Linking.openURL(explorerTx(chain, transaction.txHash!))}
                  >
                    <Chip icon="arrow" size={1.4} />
                  </Pressable>
                ) : null}
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
