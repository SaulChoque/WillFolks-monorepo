import "react-native-get-random-values";

import { p256 } from "@noble/curves/p256";
import * as SecureStore from "expo-secure-store";

import { api } from "@/lib/api";

const STORAGE_KEY = "wf.sca.passkey.v1";
/** Relying-party id the passkey is registered under. It only labels the credential on the account. */
const RP_ID = "willfolks.app";

const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (pair) => parseInt(pair, 16));

/**
 * The account's owner: a P-256 key generated on this phone and kept in the secure store. Only its
 * public half ever leaves the device; TilcAI derives the account address from it and is never a signer.
 */
async function passkey(): Promise<{ secret: Uint8Array; publicKey: string; credentialId: string }> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  let secret: Uint8Array;
  if (raw) {
    secret = fromHex(raw);
  } else {
    secret = p256.utils.randomPrivateKey();
    await SecureStore.setItemAsync(STORAGE_KEY, toHex(secret));
  }
  const publicKey = `0x${toHex(p256.getPublicKey(secret, false))}`; // 0x04 ‖ x ‖ y
  return { secret, publicKey, credentialId: toHex(p256.getPublicKey(secret, true)).slice(0, 32) };
}

/** Issues (or finds) this user's smart account on the chain and returns its address. */
export async function createSmartAccount() {
  const { publicKey, credentialId } = await passkey();
  return api.createSmartAccount({ publicKey, credentialId, rpId: RP_ID });
}
