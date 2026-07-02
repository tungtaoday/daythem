import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SuccessScreen } from '../components/ui/SuccessScreen';

// Màn chỉ dùng cho E2E (Playwright): render component design-system thật trong
// runtime react-native-web để test mà không phải lái qua toàn bộ luồng app.
// Kích hoạt bằng EXPO_PUBLIC_E2E=1 khi chạy web.
export function E2EGallery() {
  const [pressed, setPressed] = useState(false);
  return (
    <View style={{ flex: 1 }} testID="e2e-gallery">
      <SuccessScreen
        title="Đã điểm danh!"
        sub="7/7 có mặt. Đã tự động lưu vào lịch sử mỗi học sinh."
        primaryLabel="Nhắn Zalo hỏi thăm"
        onPrimary={() => setPressed(true)}
        secondaryLabel="Về trang chính"
        onSecondary={() => setPressed(false)}
      />
      {/* Cờ để Playwright xác nhận nút primary chạy. */}
      <Text testID="primary-pressed" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.01 }}>
        {pressed ? 'PRESSED' : 'IDLE'}
      </Text>
    </View>
  );
}
