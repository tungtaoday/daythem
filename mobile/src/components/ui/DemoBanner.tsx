import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore, isDemoToken } from '../../store/auth';

// Dải cảnh báo cố định khi đang ở phiên DEMO (token demo- chỉ nằm trong memory).
// Minh bạch với người dùng: dữ liệu là bản mẫu, chưa có tài khoản thật.
export function DemoBanner() {
  const isDemo = isDemoToken(useAuthStore(s => s.token));
  if (!isDemo) return null;
  return (
    <View style={s.wrap}>
      <Text style={s.text}>🧪 Đang xem bản dùng thử — dữ liệu mẫu, chưa lưu tài khoản. Có mạng hãy đăng nhập lại.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#fdf3d7', borderBottomWidth: 1, borderBottomColor: '#efdfae',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  text: { fontSize: 13, color: '#7a6224', lineHeight: 18, fontWeight: '600' },
});
