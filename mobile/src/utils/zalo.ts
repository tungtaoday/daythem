import { Linking } from 'react-native';

/** Try to open the Zalo app (falls back to the web zalo.me). Returns true if a URL opened. */
export async function openZalo(): Promise<boolean> {
  try {
    await Linking.openURL('https://zalo.me');
    return true;
  } catch {
    return false;
  }
}
