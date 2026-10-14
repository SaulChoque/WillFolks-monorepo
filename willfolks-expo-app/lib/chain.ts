import "react-native-get-random-values";

import { Contract, JsonRpcProvider, Wallet, formatEther } from "ethers";
import * as SecureStore from "expo-secure-store";

import { type ChainConfig, type EscrowParams, ApiError, api } from "@/lib/api";

const WALLET_STORAGE_KEY = "wf.wallet.v1";
/** Gas for approve + createGoal at the testnet gas price, with room to spare. */
const MIN_GAS_WEI = 60_000_000_000_000_000n; // 0.06 MON

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];
const ESCROW_ABI = [
  "function createGoal(uint128 stake, uint40 startAt, uint40 endAt, uint16 lockDays, uint8 kind, bytes32 metadataHash) returns (uint256)",
  "function cancel(uint256 goalId)",
];

let cached: { at: number; config: ChainConfig } | null = null;

/** Network and contract addresses published by the backend (cached for a minute). */
export async function chainConfig(): Promise<ChainConfig> {
  if (cached && Date.now() - cached.at < 60_000) return cached.config;
  const config = await api.chainConfig();
  cached = { at: Date.now(), config };
  return config;
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** The device wallet created at first launch, loaded from the secure store. */
async function signer(config: Extract<ChainConfig, { enabled: true }>): Promise<Wallet> {
  const raw = await SecureStore.getItemAsync(WALLET_STORAGE_KEY);
  const secrets = raw ? (JSON.parse(raw) as { privateKey?: string }) : null;
  if (!secrets?.privateKey) throw new ApiError(0, "NO_WALLET", "This device has no wallet yet.");
  const provider = new JsonRpcProvider(config.rpcUrl, config.chainId, { staticNetwork: true });
  return new Wallet(secrets.privateKey, provider);
}

/** Proves ownership of the device wallet to the backend so it can be tied to the account. */
export async function linkWallet(address: string | null): Promise<void> {
  const config = await chainConfig();
  if (!config.enabled) return;
  const raw = await SecureStore.getItemAsync(WALLET_STORAGE_KEY);
  const secrets = raw ? (JSON.parse(raw) as { privateKey?: string; address?: string }) : null;
  if (!secrets?.privateKey) return;
  const wallet = new Wallet(secrets.privateKey);
  if (address && address.toLowerCase() === wallet.address.toLowerCase()) return;
  const info = await api.chainWallet();
  await api.linkChainWallet(wallet.address, await wallet.signMessage(info.linkMessage));
}

/** Retries a call that can fail only because the RPC node answering is a block behind. */
async function retry<T>(job: () => Promise<T>, attempts = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await job();
    } catch (error) {
      if (attempt >= attempts) throw error;
      await sleep(1_500 * attempt);
    }
  }
}

/**
 * Locks the stake: `approve` on the token, then `createGoal` on the escrow, both signed with
 * the device wallet. Returns the hash of the `createGoal` transaction.
 */
export async function lockStake(params: EscrowParams): Promise<string> {
  const config = await chainConfig();
  if (!config.enabled) throw new ApiError(0, "CHAIN_DISABLED", "On-chain escrow is disabled.");
  const wallet = await signer(config);

  const native = await wallet.provider!.getBalance(wallet.address);
  if (native < MIN_GAS_WEI) {
    throw new ApiError(0, "NEEDS_GAS", `Not enough gas: ${formatEther(native)} MON.`, { balance: formatEther(native) });
  }

  const stake = BigInt(params.stake);
  const token = new Contract(params.token, ERC20_ABI, wallet);
  const escrow = new Contract(params.contract, ESCROW_ABI, wallet);

  const allowance = (await token.allowance(wallet.address, params.contract)) as bigint;
  if (allowance < stake) {
    const approval = await retry(() => token.approve(params.contract, stake));
    await approval.wait(1);
    // Public RPCs balance load across nodes: wait until the allowance is visible.
    for (let i = 0; i < 20; i++) {
      if (((await token.allowance(wallet.address, params.contract)) as bigint) >= stake) break;
      await sleep(1_000);
    }
  }

  const created = await retry(() =>
    escrow.createGoal(params.stake, params.startAt, params.endAt, params.lockDays, params.kind, params.metadataHash),
  );
  await created.wait(1);
  return created.hash as string;
}

/** Cancels a goal that has not started yet; the stake returns to the wallet. */
export async function cancelOnChain(contract: string, escrowGoalId: string): Promise<string> {
  const config = await chainConfig();
  if (!config.enabled) throw new ApiError(0, "CHAIN_DISABLED", "On-chain escrow is disabled.");
  const wallet = await signer(config);
  const escrow = new Contract(contract, ESCROW_ABI, wallet);
  const cancelled = await retry(() => escrow.cancel(escrowGoalId));
  await cancelled.wait(1);
  return cancelled.hash as string;
}

/** MonadVision: the public explorer where every transaction of the app can be checked. */
export const MONAD_VISION_URL = "https://testnet.monadvision.com";
const MONAD_TESTNET_ID = 10143;

/** MonadVision for Monad testnet (or while the config is unknown); the backend's explorer on any other network. */
const explorerBase = (config?: ChainConfig) =>
  config?.enabled && config.chainId !== MONAD_TESTNET_ID ? config.explorerUrl : MONAD_VISION_URL;

export const explorerTx = (config: ChainConfig | undefined, hash: string) => `${explorerBase(config)}/tx/${hash}`;
export const explorerAddress = (config: ChainConfig | undefined, address: string) => `${explorerBase(config)}/address/${address}`;
