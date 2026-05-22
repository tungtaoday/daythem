import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/auth';
import { useClassesStore } from '../../store/classes';
import { IconZalo, IconChevron, IconPhone, IconBell, IconWallet } from '../../components/icons';

function SectionHeader({ children }: { children: string }) {
  return <Text style={s.sectionHeader}>{children}</Text>;
}

function SettingRow({ label, value, chevron, coral, onPress }: any) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={[s.rowLabel, coral && { color: colors.coral700 }]}>{label}</Text>
      {value && <Text style={s.rowValue}>{value}</Text>}
      {chevron && <IconChevron size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}

function ToggleRow({ label, sub, value, onToggle }: any) {
  const [on, setOn] = useState(value ?? true);
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={on}
        onValueChange={v => { setOn(v); onToggle?.(v); }}
        trackColor={{ false: colors.border, true: colors.green500 }}
        thumbColor="white"
      />
    </View>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={st.value}>{value}</Text>
      <Text style={st.label}>{label}</Text>
    </View>
  );
}
const st = StyleSheet.create({
  value: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontWeight: '500' },
});

export function ProfileScreen({ navigation }: any) {
  const { teacher, logout } = useAuthStore();
  const { classes } = useClassesStore();

  const totalStudents = classes.reduce((a, c) => a + (c.student_count || 0), 0) || 17;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={s.container}>
      {/* Back button */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevron size={20} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>
        <Text style={s.topTitle}>Tài khoản</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile header */}
        <View style={s.profileHead}>
          <Avatar name={teacher?.name || 'G'} size={72} />
          <Text style={s.name}>{teacher?.name || 'Cô giáo'}</Text>
          <Text style={s.role}>Giáo viên Toán · 8 năm kinh nghiệm</Text>
          <View style={s.zaloBadge}>
            <IconZalo size={13} color="#3a7dd3" />
            <Text style={s.zaloBadgeText}>Zalo · Liên kết</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsCard}>
          <StatItem value={String(classes.length || 2)} label="Lớp đang dạy" />
          <View style={s.statsDivider} />
          <StatItem value={String(totalStudents)} label="Học sinh" />
          <View style={s.statsDivider} />
          <StatItem value="124" label="Buổi đã dạy" />
        </View>

        {/* TÀI KHOẢN */}
        <SectionHeader>TÀI KHOẢN</SectionHeader>
        <View style={s.card}>
          <SettingRow label="Số điện thoại" value={teacher?.phone || '091 234 5678'} />
          <View style={s.divider} />
          <SettingRow label="Email" value="ngthumai@gmail.com" />
          <View style={s.divider} />
          <SettingRow label="Đổi mật khẩu" chevron onPress={() => {}} />
        </View>

        {/* NHẬN HỌC PHÍ */}
        <SectionHeader>NHẬN HỌC PHÍ</SectionHeader>
        <View style={s.card}>
          <View style={s.bankRow}>
            <View style={s.bankIcon}>
              <IconWallet size={18} color={colors.green700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.bankName}>Vietcombank · 0123 456 789</Text>
              <Text style={s.bankSub}>Tên chủ TK: NG. T. MAI</Text>
            </View>
            <View style={s.qrBadge}>
              <Text style={s.qrBadgeText}>QR · Đã tạo</Text>
            </View>
          </View>
          <Text style={s.bankNote}>
            Phụ huynh sẽ thấy thông tin này trong tin nhắc nộp tiền
          </Text>
        </View>

        {/* THÔNG BÁO */}
        <SectionHeader>THÔNG BÁO</SectionHeader>
        <View style={s.card}>
          <ToggleRow
            label="Thông báo đẩy"
            sub="Buổi học, học phí, hồi đáp Zalo"
            value={true}
          />
          <View style={s.divider} />
          <ToggleRow
            label="Zalo · Tóm tắt 7h sáng"
            sub="Liệt kê việc cô cần làm hôm nay"
            value={true}
          />
          <View style={s.divider} />
          <ToggleRow
            label="Không làm phiền"
            sub="22h – 7h · App không gửi push trong khung giờ này"
            value={true}
          />
        </View>

        {/* ỨNG DỤNG */}
        <SectionHeader>ỨNG DỤNG</SectionHeader>
        <View style={s.card}>
          <SettingRow label="Ngôn ngữ" value="Tiếng Việt" chevron onPress={() => {}} />
          <View style={s.divider} />
          <SettingRow label="Giao diện" value="Sáng" chevron onPress={() => {}} />
          <View style={s.divider} />
          <SettingRow label="Liên hệ hỗ trợ" chevron onPress={() => {}} />
        </View>

        {/* KHÁC */}
        <SectionHeader>KHÁC</SectionHeader>
        <View style={s.card}>
          <SettingRow label="Điều khoản & bảo mật" chevron onPress={() => {}} />
          <View style={s.divider} />
          <SettingRow label="Phiên bản" value="1.0.0 · Beta" />
          <View style={s.divider} />
          <SettingRow label="Đăng xuất" coral onPress={handleLogout} />
        </View>

        <Text style={s.footerNote}>
          Dữ liệu lớp & học sinh được lưu trên máy chủ.{'\n'}Đăng nhập lại sẽ thấy lại toàn bộ.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 8,
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'white', borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  profileHead: {
    alignItems: 'center', paddingTop: 12, paddingBottom: 20, paddingHorizontal: 20,
  },
  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 12, letterSpacing: -0.3 },
  role: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  zaloBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#e8f2fb', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5, marginTop: 10,
  },
  zaloBadgeText: { fontSize: 12, fontWeight: '600', color: '#3a7dd3' },
  statsCard: {
    flexDirection: 'row', backgroundColor: 'white',
    borderRadius: 18, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, paddingVertical: 16, marginBottom: 24,
  },
  statsDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.4, marginBottom: 8, marginHorizontal: 16, marginTop: 4,
  },
  card: {
    backgroundColor: 'white', borderRadius: 18,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginBottom: 16, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 8, minHeight: 52,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  rowValue: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bankRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  bankIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.green100,
    alignItems: 'center', justifyContent: 'center',
  },
  bankName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  bankSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  qrBadge: { backgroundColor: colors.green100, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  qrBadgeText: { fontSize: 11, fontWeight: '600', color: colors.green700 },
  bankNote: {
    fontSize: 12, color: colors.textSecondary, lineHeight: 18,
    paddingHorizontal: 16, paddingBottom: 14, marginTop: -4,
  },
  footerNote: {
    fontSize: 12, color: colors.textMuted, textAlign: 'center',
    lineHeight: 18, marginHorizontal: 32, marginTop: 8,
  },
});
