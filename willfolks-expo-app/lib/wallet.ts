import type { PixelIconName } from "@/constants/pixel-icons";
import { getDeviceLocaleTag, t } from "@/i18n";
import type { Transaction } from "@/lib/api";

/** Movements that add to the spendable balance. */
export const INCOMING: Transaction["type"][] = ["deposit", "stake_release", "reward"];

export const TX_ICONS: Record<Transaction["type"], PixelIconName> = {
  deposit: "coin",
  withdrawal: "arrow",
  stake_lock: "lock",
  stake_release: "check",
  penalty: "close",
  reward: "spark",
  donation: "heart",
};

/** "11 Oct, 07:41" in the device language. */
/** A movement's note, with provider and test-network names swapped for plain words. */
export const displayNote = (note?: string | null) => {
  if (!note) return null;
  if (/tilcai/i.test(note)) return t("walletScreen.notes.qrDeposit");
  if (/faucet/i.test(note)) return t("walletScreen.notes.testBalance");
  return note;
};

export const formatMoment = (value: string) =>
  new Date(value).toLocaleString(getDeviceLocaleTag(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
