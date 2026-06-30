import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

/** Copy text to the clipboard on both web and native. Returns true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    }
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
