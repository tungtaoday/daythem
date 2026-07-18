import { Platform, Alert } from 'react-native';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Lưu + chia sẻ 1 file .docx nhận dưới dạng base64 (backend sinh sẵn).
// Web: tải xuống qua Blob. Native: ghi file cache + mở bảng chia sẻ (như xuất Excel).
export async function exportDocxBase64(base64: string, filename: string) {
  try {
    if (Platform.OS === 'web') {
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: DOCX_MIME });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // SDK 54: PHẢI dùng 'expo-file-system/legacy' — bản thường ném lỗi runtime.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [FS, Sharing] = await Promise.all([
        import('expo-file-system/legacy') as Promise<any>,
        import('expo-sharing') as Promise<any>,
      ]);
      const uri = FS.cacheDirectory + filename;
      await FS.writeAsStringAsync(uri, base64, { encoding: 'base64' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: DOCX_MIME, dialogTitle: 'Xuất tờ khai DOCX' });
      } else {
        Alert.alert('Đã lưu file', 'Thiết bị chưa hỗ trợ chia sẻ trực tiếp.');
      }
    }
  } catch {
    Alert.alert('Lỗi', 'Không xuất được file DOCX trên thiết bị này.');
  }
}
