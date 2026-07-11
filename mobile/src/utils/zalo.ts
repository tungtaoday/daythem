import { Linking, Platform, Share } from 'react-native';
import { copyToClipboard } from './clipboard';

const digits = (p?: string) => (p || '').replace(/[^\d]/g, '');

export type ZaloResult = 'chat' | 'share' | 'app' | false;

/**
 * Mở Zalo để nhắn.
 * - Có SĐT phụ huynh → mở đúng cửa sổ chat (`zalo.me/<phone>`) + tự copy nội dung
 *   để GV dán 1 chạm.
 * - Không có số → share-sheet (native) hoặc mở Zalo chung; nội dung đã copy sẵn.
 *
 * Lưu ý (trung thực): API công khai KHÔNG cho tự gửi tin cá nhân — chỉ mở sẵn chat + dán.
 */
export async function openZalo(phone?: string, message?: string): Promise<ZaloResult> {
  if (message) {
    try { await copyToClipboard(message); } catch { /* vẫn tiếp tục */ }
  }
  const d = digits(phone);
  try {
    if (d) {
      await Linking.openURL(`https://zalo.me/${d}`);
      return 'chat';
    }
    if (message && Platform.OS !== 'web') {
      try { await Share.share({ message }); return 'share'; } catch { /* fallback dưới */ }
    }
    await Linking.openURL('https://zalo.me');
    return 'app';
  } catch {
    return false;
  }
}
