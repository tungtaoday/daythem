import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SuccessScreen } from '../components/ui/SuccessScreen';
import { Button } from '../components/ui/Button';
import { colors } from '../theme';

// Màn chỉ dùng cho E2E (Playwright): render component design-system thật trong
// runtime react-native-web để test mà không phải lái qua toàn bộ luồng app.
// Kích hoạt bằng EXPO_PUBLIC_E2E=1 khi chạy web.
const VARIANTS = ['primary', 'secondary', 'ghost', 'outline', 'danger', 'onHero'] as const;

export function E2EGallery() {
  const [pressed, setPressed] = useState('');
  const [primaryPressed, setPrimaryPressed] = useState(false);

  return (
    <ScrollView testID="e2e-gallery" style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      {/* ── Button variants ── */}
      <Text testID="btn-section-title" style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Buttons</Text>
      {VARIANTS.map(v => (
        <Button key={v} testID={`btn-${v}`} label={`Nút ${v}`} variant={v} onPress={() => setPressed(v)} />
      ))}
      <Button testID="btn-loading" label="Đang tải" loading onPress={() => {}} />
      <Button testID="btn-disabled" label="Vô hiệu" disabled onPress={() => setPressed('disabled')} />
      <Text testID="btn-pressed" style={{ fontSize: 12, color: colors.textSecondary }}>{pressed || 'NONE'}</Text>

      {/* ── SuccessScreen ── */}
      <View style={{ height: 460, marginTop: 16 }}>
        <SuccessScreen
          title="Đã điểm danh!"
          sub="7/7 có mặt. Đã tự động lưu vào lịch sử mỗi học sinh."
          primaryLabel="Nhắn Zalo hỏi thăm"
          onPrimary={() => setPrimaryPressed(true)}
          secondaryLabel="Về trang chính"
          onSecondary={() => setPrimaryPressed(false)}
        />
      </View>
      <Text testID="primary-pressed" style={{ opacity: 0.01 }}>{primaryPressed ? 'PRESSED' : 'IDLE'}</Text>
    </ScrollView>
  );
}
