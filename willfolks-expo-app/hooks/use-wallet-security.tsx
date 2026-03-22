import "react-native-get-random-values";

import { t } from "@/i18n";
import { Wallet } from "ethers";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface WalletSecrets {
  address: string;
  privateKey: string;
  mnemonic: string;
}

interface WalletSecurityContextValue {
  wallet: WalletSecrets | null;
  isInitializing: boolean;
  firstLaunchBiometricRequired: boolean;
  sensitiveUnlocked: boolean;
  biometricAvailable: boolean;
  biometricError: string | null;
  initializationError: string | null;
  authenticateToReveal: () => Promise<boolean>;
  lockSensitiveData: () => void;
}

const WALLET_STORAGE_KEY = "wf.wallet.v1";
const BIOMETRIC_ONBOARDING_KEY = "wf.biometric.onboarding.v1";

const WalletSecurityContext = createContext<
  WalletSecurityContextValue | undefined
>(undefined);

function parseWalletSecrets(value: string | null): WalletSecrets | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as WalletSecrets;

    if (!parsed?.address || !parsed?.privateKey || !parsed?.mnemonic) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function hasBiometricSetup() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return isEnrolled;
}

export function WalletSecurityProvider({ children }: PropsWithChildren) {
  const [wallet, setWallet] = useState<WalletSecrets | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [firstLaunchBiometricRequired, setFirstLaunchBiometricRequired] =
    useState(false);
  const [sensitiveUnlocked, setSensitiveUnlocked] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  const initialize = useCallback(async () => {
    setIsInitializing(true);
    setInitializationError(null);

    try {
      const [storedWalletRaw, onboardingValue] = await Promise.all([
        SecureStore.getItemAsync(WALLET_STORAGE_KEY),
        SecureStore.getItemAsync(BIOMETRIC_ONBOARDING_KEY),
      ]);

      let currentWallet = parseWalletSecrets(storedWalletRaw);

      if (!currentWallet) {
        const createdWallet = Wallet.createRandom();
        const mnemonicPhrase = createdWallet.mnemonic?.phrase ?? "";

        if (!mnemonicPhrase) {
          throw new Error(t("walletSecurity.seedGenerationFailed"));
        }

        currentWallet = {
          address: createdWallet.address,
          privateKey: createdWallet.privateKey,
          mnemonic: mnemonicPhrase,
        };

        await SecureStore.setItemAsync(
          WALLET_STORAGE_KEY,
          JSON.stringify(currentWallet),
        );
      }

      setWallet(currentWallet);

      const biometricReady = await hasBiometricSetup();
      setBiometricAvailable(biometricReady);

      const needsBiometricOnboarding = onboardingValue !== "done";
      setFirstLaunchBiometricRequired(needsBiometricOnboarding);

      if (needsBiometricOnboarding && !biometricReady) {
        setBiometricError(t("walletSecurity.noBiometricSetup"));
      }
    } catch (error) {
      setInitializationError(
        error instanceof Error
          ? error.message
          : t("walletSecurity.initializationError"),
      );
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const authenticateToReveal = useCallback(async () => {
    setBiometricError(null);

    const biometricReady = await hasBiometricSetup();
    setBiometricAvailable(biometricReady);

    if (!biometricReady) {
      setBiometricError(t("walletSecurity.biometricUnavailable"));
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t("walletSecurity.authenticatePrompt"),
      cancelLabel: t("walletSecurity.authenticateCancel"),
      disableDeviceFallback: true,
    });

    if (!result.success) {
      if (result.error === "user_cancel" || result.error === "system_cancel") {
        return false;
      }

      setBiometricError(t("walletSecurity.validationFailed"));
      return false;
    }

    setSensitiveUnlocked(true);

    if (firstLaunchBiometricRequired) {
      await SecureStore.setItemAsync(BIOMETRIC_ONBOARDING_KEY, "done");
      setFirstLaunchBiometricRequired(false);
    }

    return true;
  }, [firstLaunchBiometricRequired]);

  const lockSensitiveData = useCallback(() => {
    setSensitiveUnlocked(false);
  }, []);

  const value = useMemo<WalletSecurityContextValue>(
    () => ({
      wallet,
      isInitializing,
      firstLaunchBiometricRequired,
      sensitiveUnlocked,
      biometricAvailable,
      biometricError,
      initializationError,
      authenticateToReveal,
      lockSensitiveData,
    }),
    [
      wallet,
      isInitializing,
      firstLaunchBiometricRequired,
      sensitiveUnlocked,
      biometricAvailable,
      biometricError,
      initializationError,
      authenticateToReveal,
      lockSensitiveData,
    ],
  );

  return (
    <WalletSecurityContext.Provider value={value}>
      {children}
    </WalletSecurityContext.Provider>
  );
}

export function useWalletSecurity() {
  const context = useContext(WalletSecurityContext);

  if (!context) {
    throw new Error(t("walletSecurity.contextError"));
  }

  return context;
}
