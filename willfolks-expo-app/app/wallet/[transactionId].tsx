import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Screen } from "@/components/pixel/screen";
import { Card, Chip, Main, Notice, SectionTitle, T } from "@/components/pixel/ui";
import { usePixelTheme } from "@/hooks/use-app-store";
import { useApi } from "@/hooks/use-api";
import { t } from "@/i18n";
import { api } from "@/lib/api";
import { TX_ICONS, formatMoment } from "@/lib/wallet";

function Line({ label, value }: { label: string; value: string }) {
  const theme = usePixelTheme();
  return (
    <View style={{ gap: theme.em(0.15), paddingTop: theme.em(0.4), borderTopWidth: theme.line, borderColor: theme.fg }}>
      <T v="label">{label}</T>
      <T v="mono" selectable>
        {value}
      </T>
    </View>
  );
}

/** Voucher of a single wallet movement. */
export default function VoucherScreen() {
  const theme = usePixelTheme();
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const { data: transaction, error, loading, reload } = useApi(() => api.transaction(transactionId));

  return (
    <Screen onRefresh={reload}>
      <SectionTitle>{t("walletScreen.voucher")}</SectionTitle>
      {error ? <Notice>{error}</Notice> : null}
      {loading && !transaction ? <T v="note">{t("common.loading")}</T> : null}
      {transaction ? (
        <Card contentStyle={{ gap: theme.em(0.5) }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
            <Chip icon={TX_ICONS[transaction.type]} solid />
            <Main title={t(`walletScreen.types.${transaction.type}`)} note={t(`walletScreen.status.${transaction.status}`)} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: theme.em(0.5) }}>
            <T v="big" testID="voucher-amount">
              {transaction.amount.toFixed(2)}
            </T>
            <T v="unit" style={{ marginBottom: theme.em(0.35) }}>
              {transaction.currency}
            </T>
          </View>
          <Line label={t("walletScreen.reference")} value={transaction.referenceCode} />
          <Line label={t("walletScreen.date")} value={formatMoment(transaction.createdAt)} />
          <Line label={t("walletScreen.method")} value={t(`walletScreen.methods.${transaction.method}`)} />
          {transaction.chain ? <Line label={t("account.chain")} value={transaction.chain} /> : null}
          {transaction.txHash ? <Line label={t("walletScreen.txHash")} value={transaction.txHash} /> : null}
          {transaction.note ? <Line label={t("walletScreen.note")} value={transaction.note} /> : null}
        </Card>
      ) : null}
    </Screen>
  );
}
