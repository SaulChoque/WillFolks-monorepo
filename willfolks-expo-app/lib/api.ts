import type { PetMood } from "@/constants/pet-sprite";
import type { ThemeId } from "@/constants/theme";

/** Production backend (Vercel). */
const DEFAULT_API_URL = "https://api.willfolks.bamp.lat";

/**
 * Base URL of willfolks-BE. Defaults to the deployed backend; set EXPO_PUBLIC_API_URL to use a
 * local one (http://10.0.2.2:3000 from the Android emulator, or `adb reverse tcp:3000 tcp:3000`
 * with http://localhost:3000 on a device).
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

const TIMEOUT_MS = 12_000;
/** Calls that wait for the chain (a confirmed transaction, a paid verdict) take far longer than a database read. */
const CHAIN_TIMEOUT_MS = 120_000;

export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 when the server could not be reached. */
    readonly status: number,
    /** Machine-readable reason, e.g. INSUFFICIENT_FUNDS or NETWORK. */
    readonly code: string | undefined,
    message: string,
    readonly data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(value: string | null) {
  token = value;
}

/** Called when the server rejects the stored token (expired, or the account is gone). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/** Uploaded images come back as server-relative paths. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("/") ? `${API_URL}${path}` : path;
}

async function request<T>(method: string, path: string, body?: object | FormData, timeoutMs = TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const isForm = body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, "NETWORK", `Cannot reach ${API_URL}`);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();
    const message = Array.isArray(data?.message) ? data.message.join(". ") : (data?.message ?? `HTTP ${response.status}`);
    throw new ApiError(response.status, data?.code, message, data ?? {});
  }
  return data as T;
}

function photoForm(uri: string, fields: Record<string, string | undefined> = {}): FormData {
  const form = new FormData();
  const extension = uri.split(".").pop()?.toLowerCase();
  const type = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
  // React Native's FormData takes a file descriptor instead of a Blob.
  form.append("photo", { uri, name: `photo.${type.split("/")[1]}`, type } as unknown as Blob);
  for (const [key, value] of Object.entries(fields)) {
    if (value) form.append(key, value);
  }
  return form;
}

// ------------------------------------------------------------------ types

export interface PublicUser {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  locationLabel: string | null;
  timezone: string;
}

export interface User extends PublicUser {
  email: string;
  walletAddress: string | null;
  chain: string;
  locale: string;
  onboardingCompletedAt: string | null;
  createdAt: string;
}

export interface Settings {
  theme: ThemeId;
  haptics: boolean;
  showSeconds: boolean;
  reminders: boolean;
  vibration: boolean;
}

export interface Balance {
  available: number;
  inEscrow: number;
  penalized: number;
  currency: string;
}

export type GoalKind = "alarm" | "appTimer" | "locator" | "ai";
type ApiGoalKind = "alarm" | "app_timer" | "locator" | "ai";
export type GoalStatus = "draft" | "active" | "paused" | "completed" | "failed" | "cancelled";
export type CheckinResult = "pending" | "success" | "fail";

export interface GoalParticipant {
  userId: string;
  role: "owner" | "participant" | "judge";
  status: "invited" | "accepted" | "declined" | "left";
  stakeAmount: number;
  user: PublicUser;
}

export type EscrowState =
  | "none"
  | "pending"
  | "active"
  | "succeeded"
  | "failed_locked"
  | "claimed"
  | "expired"
  | "cancelled";

export interface GoalEscrow {
  state: EscrowState;
  contract: string | null;
  chainId: number | null;
  goalId: string | null;
  startAt: string | null;
  endAt: string | null;
  unlockAt: string | null;
  createTxHash: string | null;
  resolveTxHash: string | null;
  claimTxHash: string | null;
  error: string | null;
}

export interface EscrowParams {
  chainId: number;
  contract: string;
  token: string;
  /** Token units (6 decimals) as a decimal string. */
  stake: string;
  startAt: number;
  endAt: number;
  lockDays: number;
  kind: number;
  metadataHash: string;
}

export type ChainConfig =
  | { enabled: false }
  | {
      enabled: true;
      name: string;
      chainId: number;
      rpcUrl: string;
      explorerUrl: string;
      usdc: string;
      escrow: string;
      attestor: string;
      maxStake: number;
      resolutionGraceSeconds: number;
      faucet: { usdc: number; gasMon: string };
      /** USDC of the simulated fiat deposit the wallet screen offers. */
      fiatDepositUsdc?: number;
      demoGoalSeconds: number;
    };

/** The user's smart account on the chain (issued by TilcAI); `enabled: false` when the backend does not offer it. */
export interface SmartAccountInfo {
  enabled: boolean;
  account: { address: string; state: string; deployTx: string | null; usdc: number | null } | null;
}

export interface ChainWallet {
  enabled: boolean;
  address: string | null;
  linkMessage: string;
  usdc: number;
  /** Native balance in wei, as a decimal string. */
  native: string;
}

export interface Goal {
  id: string;
  ownerId: string;
  kind: GoalKind;
  title: string;
  description: string | null;
  status: GoalStatus;
  stakeAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  /** 0 = Sunday … 6 = Saturday. */
  repeatDays: number[];
  notificationsEnabled: boolean;
  maxAttempts: number;
  extraLockDays: number;
  devTipPercent: number;
  isGroup: boolean;
  groupMode: "coop" | "vs" | null;
  escrowTxHash: string | null;
  /** On-chain escrow of the stake; `state` is "none" for goals that never used the chain. */
  escrow: GoalEscrow;
  /** Present only on the response of POST /goals: what the wallet must submit to createGoal. */
  escrowParams?: EscrowParams;
  createdAt: string;
  alarm: { targetTime: string; reactionSeconds: number; soundTitle: string | null; vibrationEnabled: boolean } | null;
  appTimer: { appPackage: string; appName: string; maxDailyMinutes: number } | null;
  location: { placeLabel: string; latitude: number; longitude: number; radiusM: number; arriveBy: string } | null;
  ai: { prompt: string; verifier: "ai" | "friend"; verifierUserId: string | null } | null;
  participants: GoalParticipant[];
  me: { role: GoalParticipant["role"]; status: GoalParticipant["status"]; stakeAmount: number } | null;
  progress: {
    successCount: number;
    failCount: number;
    pendingCount: number;
    attemptsLeft: number;
    lastCheckin: { scheduledFor: string; result: CheckinResult } | null;
  };
}

export interface NewGoal {
  kind: GoalKind;
  title: string;
  stakeAmount: number;
  /** Local calendar day the goal starts; the server falls back to its own (UTC) day, which lags a day behind for phones west of UTC. */
  startDate?: string;
  endDate: string;
  repeatDays: number[];
  notificationsEnabled: boolean;
  maxAttempts: number;
  extraLockDays: number;
  devTipPercent: number;
  participantIds?: string[];
  groupMode?: "coop" | "vs";
  alarm?: { targetTime: string; reactionSeconds: number; vibrationEnabled: boolean };
  appTimer?: { appPackage: string; appName: string; maxDailyMinutes: number };
  location?: { placeLabel: string; latitude: number; longitude: number; radiusM: number; arriveBy: string };
  ai?: { prompt: string; verifier: "ai" | "friend"; verifierUserId?: string };
}

export interface Checkin {
  id: string;
  goalId: string;
  userId: string;
  scheduledFor: string;
  occurredAt: string;
  result: CheckinResult;
  source: "alarm" | "usage" | "location" | "proof" | "manual";
  measuredValue: number | null;
  measuredUnit: string | null;
}

export interface NewCheckin {
  source: "alarm" | "usage" | "location" | "manual";
  result?: "success" | "fail";
  scheduledFor: string;
  measuredValue?: number;
  measuredUnit?: string;
  latitude?: number;
  longitude?: number;
}

export interface Proof {
  id: string;
  goalId: string;
  userId: string;
  mediaUrl: string;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  verifier: "ai" | "friend";
  verdictReason: string | null;
  createdAt: string;
}

export interface ProofReview extends Proof {
  goalTitle: string;
  prompt: string | null;
  user: PublicUser;
}

/** Terms of buying USDC with a Bolivian bank QR. */
export interface QrTerms {
  enabled: boolean;
  currency: "BOB";
  bobPerUsd: number;
  minUsdc: number;
  maxUsdc: number;
  expiresMinutes: number;
}

/** A bank QR issued for one purchase. */
export interface QrPurchase {
  id: string;
  /** Sent back to confirm the purchase. */
  ticket: string;
  usdc: number;
  bob: number;
  bobPerUsd: number;
  expiresAt: string;
  /** One string per row, "1" = dark module; null when only the image is available. */
  modules: string[] | null;
  /** PNG, base64. */
  image: string;
}

export type QrPurchaseStatus =
  | { status: "pending" | "expired"; id: string }
  | { status: "paid"; id: string; transaction: Transaction };

export interface Transaction {
  id: string;
  goalId: string | null;
  type: "deposit" | "withdrawal" | "stake_lock" | "stake_release" | "penalty" | "reward" | "donation";
  method: "crypto" | "fiat" | "internal";
  amount: number;
  currency: string;
  status: "pending" | "confirmed" | "failed";
  chain: string | null;
  txHash: string | null;
  referenceCode: string;
  note: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: { goalId?: string; userId?: string; proofId?: string; transactionId?: string };
  readAt: string | null;
  createdAt: string;
}

export interface Pet {
  name: string;
  mood: Extract<PetMood, "idle" | "happy" | "sad">;
  energy: number;
  streak: number;
  bestStreak: number;
}

export interface FeedEntry {
  id: string;
  goalId: string | null;
  kind: GoalKind | null;
  title: string | null;
  tone: "won" | "lost" | "staked" | "neutral";
  amount: number;
  value: string | null;
  occurredAt: string;
}

export interface Dashboard {
  balance: Balance;
  pet: Pet;
  unreadNotifications: number;
  activeGoals: number;
  feed: FeedEntry[];
}

export interface FriendLink {
  id: string;
  status: "pending" | "accepted";
  since: string;
  user: PublicUser;
}

export interface Friends {
  friends: FriendLink[];
  incoming: FriendLink[];
  outgoing: FriendLink[];
}

export interface UserSearchResult extends PublicUser {
  friendship: { id: string; status: "pending" | "accepted" | "declined" | "blocked"; incoming: boolean } | null;
}

export interface DeviceReport {
  installId: string;
  platform: "android" | "ios" | "web";
  model?: string;
  osVersion?: string;
  appVersion?: string;
  notificationsGranted: boolean;
  exactAlarmGranted: boolean;
  usageAccessGranted: boolean;
  cameraGranted: boolean;
  locationAccess: "none" | "foreground" | "background";
}

export interface UsageSample {
  appPackage: string;
  appName: string;
  usageDate: string;
  foregroundMinutes: number;
}

// The API names the kind in snake_case; the app (and its copy keys) in camelCase.
const fromApiKind = (kind: ApiGoalKind): GoalKind => (kind === "app_timer" ? "appTimer" : kind);
const toApiKind = (kind: GoalKind): ApiGoalKind => (kind === "appTimer" ? "app_timer" : kind);
type ApiGoal = Omit<Goal, "kind"> & { kind: ApiGoalKind };
const goal = (raw: ApiGoal): Goal => ({ ...raw, kind: fromApiKind(raw.kind) });
type ApiDashboard = Omit<Dashboard, "feed"> & { feed: (Omit<FeedEntry, "kind"> & { kind: ApiGoalKind | null })[] };

// ------------------------------------------------------------------ endpoints

export const api = {
  health: () => request<{ status: string }>("GET", "/health"),

  login: (body: { email: string; displayName?: string; walletAddress?: string; timezone?: string; locale?: string }) =>
    request<{ accessToken: string; isNew: boolean; user: User }>("POST", "/auth/login", body),

  me: () => request<User>("GET", "/users/me"),
  updateMe: (body: Partial<Pick<User, "displayName" | "username" | "locationLabel" | "timezone">> & { onboardingCompleted?: boolean }) =>
    request<User>("PATCH", "/users/me", body),
  uploadAvatar: (uri: string) => request<User>("POST", "/users/me/avatar", photoForm(uri)),
  deleteMe: () => request<void>("DELETE", "/users/me"),
  searchUsers: (query: string) => request<UserSearchResult[]>("GET", `/users/search?q=${encodeURIComponent(query)}`),

  settings: () => request<Settings>("GET", "/users/me/settings"),
  updateSettings: (body: Partial<Settings>) => request<Settings>("PUT", "/users/me/settings", body),

  reportDevice: (body: DeviceReport) => request<unknown>("PUT", "/devices", body),

  dashboard: async (): Promise<Dashboard> => {
    const raw = await request<ApiDashboard>("GET", "/dashboard");
    return { ...raw, feed: raw.feed.map((entry) => ({ ...entry, kind: entry.kind && fromApiKind(entry.kind) })) };
  },

  goals: async () => (await request<ApiGoal[]>("GET", "/goals")).map(goal),
  goal: async (id: string) => goal(await request<ApiGoal>("GET", `/goals/${id}`)),
  createGoal: async (body: NewGoal) => goal(await request<ApiGoal>("POST", "/goals", { ...body, kind: toApiKind(body.kind) })),
  updateGoal: async (
    id: string,
    body: Partial<Pick<Goal, "title" | "notificationsEnabled" | "repeatDays">> & { status?: "active" | "paused" },
  ) => goal(await request<ApiGoal>("PATCH", `/goals/${id}`, body)),
  cancelGoal: (id: string) => request<void>("DELETE", `/goals/${id}`),
  respondInvite: (id: string, accept: boolean) => request<unknown>("PATCH", `/goals/${id}/invitation`, { accept }),

  checkins: (goalId: string) => request<Checkin[]>("GET", `/goals/${goalId}/checkins`),
  checkin: async (goalId: string, body: NewCheckin) => {
    const raw = await request<{ checkin: Checkin; goal: ApiGoal }>("POST", `/goals/${goalId}/checkins`, body);
    return { checkin: raw.checkin, goal: goal(raw.goal) };
  },

  proofs: (goalId: string) => request<Proof[]>("GET", `/goals/${goalId}/proofs`),
  submitProof: async (goalId: string, uri: string, fields: { note?: string; scheduledFor: string }) => {
    const raw = await request<{ proof: Proof; goal: ApiGoal }>("POST", `/goals/${goalId}/proofs`, photoForm(uri, fields), CHAIN_TIMEOUT_MS);
    return { proof: raw.proof, goal: goal(raw.goal) };
  },
  proofReviews: () => request<ProofReview[]>("GET", "/proofs/reviews"),
  reviewProof: (id: string, approved: boolean, reason?: string) => request<Proof>("PATCH", `/proofs/${id}`, { approved, reason }),

  wallet: () => request<Balance>("GET", "/wallet"),
  transactions: () => request<Transaction[]>("GET", "/wallet/transactions"),
  transaction: (id: string) => request<Transaction>("GET", `/wallet/transactions/${id}`),
  deposit: (amount: number, method: "crypto" | "fiat") =>
    request<Transaction>("POST", "/wallet/deposits", { amount, method }, method === "fiat" ? CHAIN_TIMEOUT_MS : TIMEOUT_MS),
  withdraw: (amount: number) => request<Transaction>("POST", "/wallet/withdrawals", { amount }),
  qrTerms: () => request<QrTerms>("GET", "/wallet/qr-purchases/config"),
  buyWithQr: (usdc: number) => request<QrPurchase>("POST", "/wallet/qr-purchases", { usdc }, CHAIN_TIMEOUT_MS),
  /** Pending until the bank pays; the call that sees it paid also waits for the USDC to arrive. */
  confirmQr: (ticket: string) => request<QrPurchaseStatus>("POST", "/wallet/qr-purchases/confirm", { ticket }, CHAIN_TIMEOUT_MS),

  notifications: () => request<{ unread: number; items: AppNotification[] }>("GET", "/notifications"),
  readNotification: (id: string) => request<AppNotification>("PATCH", `/notifications/${id}/read`),
  readAllNotifications: () => request<{ updated: number }>("POST", "/notifications/read-all"),

  pet: () => request<Pet>("GET", "/pet"),
  petAction: (action: "feed" | "play" | "poke" | "rest") => request<Pet>("POST", "/pet/actions", { action }),

  friends: () => request<Friends>("GET", "/friends"),
  requestFriend: (userId: string) => request<unknown>("POST", "/friends", { userId }),
  respondFriend: (id: string, status: "accepted" | "declined") => request<unknown>("PATCH", `/friends/${id}`, { status }),
  removeFriend: (id: string) => request<void>("DELETE", `/friends/${id}`),

  chainConfig: () => request<ChainConfig>("GET", "/chain/config"),
  chainWallet: () => request<ChainWallet>("GET", "/chain/wallet"),
  linkChainWallet: (address: string, signature: string) => request<{ address: string }>("POST", "/chain/wallet", { address, signature }),
  faucet: () => request<{ usdc: number; usdcTx: string; gasTx: string; balance: number; explorer: string }>("POST", "/chain/faucet", undefined, CHAIN_TIMEOUT_MS),
  smartAccount: () => request<SmartAccountInfo>("GET", "/chain/account"),
  createSmartAccount: (body: { publicKey: string; credentialId: string; rpId: string }) =>
    request<{ address: string; state: string; deployTx: string | null; replayed: boolean; explorer: string }>("POST", "/chain/account", body, CHAIN_TIMEOUT_MS),
  confirmEscrow: async (goalId: string, txHash: string) =>
    goal(await request<ApiGoal>("POST", `/goals/${goalId}/escrow`, { txHash }, CHAIN_TIMEOUT_MS)),
  confirmEscrowCancel: async (goalId: string, txHash: string) =>
    goal(await request<ApiGoal>("POST", `/goals/${goalId}/escrow/cancel`, { txHash }, CHAIN_TIMEOUT_MS)),

  reportUsage: (samples: UsageSample[]) => request<{ saved: number }>("PUT", "/usage", { samples }),
};
