import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PIN_KEY = 'ceo_desk_user_pin';
const LOCK_ENABLED_KEY = 'ceo_desk_lock_enabled';

export const checkBiometricSupport = async (): Promise<{
  hasHardware: boolean;
  isEnrolled: boolean;
}> => {
  if (Platform.OS === 'web') return { hasHardware: false, isEnrolled: false };
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return { hasHardware, isEnrolled };
  } catch {
    return { hasHardware: false, isEnrolled: false };
  }
};

export const authenticateBiometric = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock CEO Desk',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
};

export const savePIN = async (pin: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(PIN_KEY, pin);
    localStorage.setItem(LOCK_ENABLED_KEY, 'true');
    return;
  }
  await SecureStore.setItemAsync(PIN_KEY, pin);
  await SecureStore.setItemAsync(LOCK_ENABLED_KEY, 'true');
};

export const getStoredPIN = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(PIN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(PIN_KEY);
  } catch {
    return null;
  }
};

export const isLockEnabled = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(LOCK_ENABLED_KEY) === 'true';
  }
  try {
    const enabled = await SecureStore.getItemAsync(LOCK_ENABLED_KEY);
    return enabled === 'true';
  } catch {
    return false;
  }
};

export const disableLock = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(LOCK_ENABLED_KEY);
    localStorage.removeItem(PIN_KEY);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(LOCK_ENABLED_KEY);
    await SecureStore.deleteItemAsync(PIN_KEY);
  } catch {
    // Ignore error
  }
};
