import * as SecureStore from "expo-secure-store";
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useWalletSecurity } from "@/hooks/use-wallet-security";
import { getDeviceLanguage } from "@/i18n";
import { ApiError, User, api, setAuthToken, setUnauthorizedHandler } from "@/lib/api";
import { linkWallet } from "@/lib/chain";

export const SESSION_TOKEN_KEY = "wf.session.token.v1";
const SESSION_USER_KEY = "wf.session.user.v1";

type SessionStatus = "loading" | "signedOut" | "signedIn";

interface SessionValue {
  status: SessionStatus;
  user: User | null;
  /** Signed in and done with the onboarding flow. */
  onboarded: boolean;
  signIn: (email: string, displayName?: string) => Promise<{ isNew: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Parameters<typeof api.updateMe>[0]) => Promise<User>;
  uploadAvatar: (uri: string) => Promise<User>;
  deleteAccount: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

function parseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const { wallet } = useWalletSecurity();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  const remember = useCallback(async (next: User) => {
    setUser(next);
    await SecureStore.setItemAsync(SESSION_USER_KEY, JSON.stringify(next));
    return next;
  }, []);

  const forget = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setStatus("signedOut");
    await Promise.all([SecureStore.deleteItemAsync(SESSION_TOKEN_KEY), SecureStore.deleteItemAsync(SESSION_USER_KEY)]);
  }, []);

  // Restore the last session; the cached profile keeps the app usable while offline.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, cached] = await Promise.all([
        SecureStore.getItemAsync(SESSION_TOKEN_KEY),
        SecureStore.getItemAsync(SESSION_USER_KEY),
      ]);
      if (cancelled) return;
      if (!token) {
        setStatus("signedOut");
        return;
      }
      setAuthToken(token);
      try {
        const fresh = await api.me();
        if (cancelled) return;
        await remember(fresh);
        setStatus("signedIn");
      } catch (error) {
        if (cancelled) return;
        const cachedUser = parseUser(cached);
        if (error instanceof ApiError && error.status === 0 && cachedUser) {
          setUser(cachedUser);
          setStatus("signedIn");
        } else {
          await forget();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forget, remember]);

  useEffect(() => {
    setUnauthorizedHandler(() => void forget());
    return () => setUnauthorizedHandler(null);
  }, [forget]);

  const signIn = useCallback(
    async (email: string, displayName?: string) => {
      const session = await api.login({
        email: email.trim().toLowerCase(),
        displayName: displayName?.trim() || undefined,
        walletAddress: wallet?.address,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: getDeviceLanguage(),
      });
      setAuthToken(session.accessToken);
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, session.accessToken);
      // With the on-chain escrow the backend ties the wallet to the account by a signed message.
      let current = session.user;
      try {
        await linkWallet(session.user.walletAddress);
        current = await api.me();
      } catch {
        // Offline chain or disabled escrow: the account still works; the wallet links later.
      }
      await remember(current);
      setStatus("signedIn");
      return { isNew: session.isNew };
    },
    [remember, wallet?.address],
  );

  const updateProfile = useCallback(
    async (patch: Parameters<typeof api.updateMe>[0]) => remember(await api.updateMe(patch)),
    [remember],
  );

  const uploadAvatar = useCallback(async (uri: string) => remember(await api.uploadAvatar(uri)), [remember]);

  const deleteAccount = useCallback(async () => {
    await api.deleteMe();
    await forget();
  }, [forget]);

  const value = useMemo<SessionValue>(
    () => ({
      status,
      user,
      onboarded: status === "signedIn" && Boolean(user?.onboardingCompletedAt),
      signIn,
      signOut: forget,
      updateProfile,
      uploadAvatar,
      deleteAccount,
    }),
    [status, user, signIn, forget, updateProfile, uploadAvatar, deleteAccount],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}
