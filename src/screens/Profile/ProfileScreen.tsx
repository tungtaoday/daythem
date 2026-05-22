import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert,
} from 'react-native';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore, Gender } from '../../store/auth';
import { useClassesStore } from '../../store/classes';
import { IconChevron, IconWallet, IconBell } from '../../components/icons';

// ── Static sub-components ─────────────────────────────────────

function SectionHeader({ children }: { children: string }) {
  return <Text style={s.sectionHeader}>{children}</Text>;
}

function ToggleRow({ label, sub, value }: any) {
  const [on, setOn] = useState(value ?? true);
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={on}
        onValueChange={setOn}
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

// ── Gender picker ─────────────────────────────────────────────

function GenderPicker({ value, onChange }: { value: Gender; onChange: (g: Gender) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
      {(['co', 'thay'] as Gender[]).map(g => (
        <TouchableOpacity
          key={g}
          style={[gp.chip, value === g && gp.chipActive]}
          onPress={() => onChange(g)}
        >
          <Text style={[gp.chipText, value === g && gp.chipTextActive]}>
            {g === 'co' ? 'Cô' : 'Thầy'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const gp = StyleSheet.create({
  chip: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'white' },
  chipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.green700 },
});

// ── Main screen ───────────────────────────────────────────────

export function ProfileScreen({ navigation }: any) {
  const { teacher, logout, updateProfile, setGender } = useAuthStore();
  const { classes } = useClassesStore();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(teacher?.name || '');
  const [editPhone, setEditPhone] = useState(teacher?.phone || '');
  const [editEmail, setEditEmail] = useState('ngthumai@gmail.com');
  const [editGender, setEditGender] = useState<Gender>(teacher?.gender ?? 'co');
  const [saving, setSaving] = useState(false);

  const totalStudents = classes.reduce((a, c) => a + (c.student_count || 0), 0) || 17;
  const gender = teacher?.gender ?? 'co';
  const title = gender === 'co' ? 'Cô giáo' : 'Thầy giáo';
  const displayName = teacher?.name || title;

  const handleEdit = () => {
    setEditName(teacher?.name || '');
    setEditPhone(teacher?.phone || '');
    setEditGender(teacher?.gender ?? 'co');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) { Alert.alert('Nhập tên của bạn'); return; }
    setSaving(true);
    try {
      await updateProfile(editName.trim(), editGender);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevron size={20} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>
        <Text style={s.topTitle}>Tài khoản</Text>
        <TouchableOpacity
          style={s.editBtn}
          onPress={editing ? handleSave : handleEdit}
          disabled={saving}
        >
          <Text style={[s.editBtnText, editing && { color: colors.green600, fontWeight: '700' }]}>
            {editing ? (saving ? 'Đang lưu...' : 'Lưu') : 'Chỉnh sửa'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile header */}
        <View style={s.profileHead}>
          <Avatar name={displayName} size={72} />
          {editing ? (
            <View style={s.editNameWrap}>
              <TextInput
                style={s.editNameInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Tên của bạn"
                placeholderTextColor={colors.textMuted}
                autoFocus
                textAlign="center"
              />
            </View>
          ) : (
            <Text style={s.name}>{displayName}</Text>
          )}
          <Text style={s.role}>{title} · 8 năm kinh nghiệm</Text>

          {/* Gender picker (always visible) */}
          {editing && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              {(['co', 'thay'] as Gender[]).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[gp.chip, editGender === g && gp.chipActive]}
                  onPress={() => setEditGender(g)}
                >
                  <Text style={[gp.chipText, editGender === g && gp.chipTextActive]}>
                    {g === 'co' ? 'Cô giáo' : 'Thầy giáo'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={s.rowLabel}>Xưng hô</Text>
            {editing
              ? <GenderPicker value={editGender} onChange={setEditGender} />
              : <Text style={s.rowValue}>{gender === 'co' ? 'Cô giáo' : 'Thầy giáo'}</Text>}
          </View>
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={s.rowLabel}>Số điện thoại</Text>
            {editing
              ? <TextInput
                  style={s.inlineInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                  placeholder="091 234 5678"
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              : <Text style={s.rowValue}>{teacher?.phone || editPhone || '091 234 5678'}</Text>}
          </View>
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={s.rowLabel}>Email</Text>
            {editing
              ? <TextInput
                  style={s.inlineInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  placeholder="email@gmail.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  textAlign="right"
                />
              : <Text style={s.rowValue}>{editEmail}</Text>}
          </View>
          <TouchableOpacity style={s.row} onPress={() => Alert.alert('Đổi mật khẩu', 'Tính năng đang phát triển.')}>
            <Text style={s.rowLabel}>Đổi mật khẩu</Text>
            <IconChevron size={16} color={colors.textMuted} />
          </TouchableOpacity>
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
            Phụ huynh sẽ thấy thông tin này trong tin nhắn nộp tiền
          </Text>
        </View>

        {/* THÔNG BÁO */}
        <SectionHeader>THÔNG BÁO</SectionHeader>
        <View style={s.card}>
          <ToggleRow label="Thông báo đẩy" sub="Buổi học, học phí, hồi đáp" value={true} />
          <View style={s.divider} />
          <ToggleRow label="Tóm tắt 7h sáng" sub="Liệt kê việc cần làm hôm nay" value={true} />
          <View style={s.divider} />
          <ToggleRow label="Không làm phiền" sub="22h – 7h · Không gửi push trong khung giờ này" value={true} />
        </View>

        {/* ỨNG DỤNG */}
        <SectionHeader>ỨNG DỤNG</SectionHeader>
        <View style={s.card}>
          <TouchableOpacity style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={() => Alert.alert('Ngôn ngữ', 'Tính năng đang phát triển.')}>
            <Text style={s.rowLabel}>Ngôn ngữ</Text>
            <Text style={s.rowValue}>Tiếng Việt</Text>
            <IconChevron size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={s.rowLabel}>Phiên bản</Text>
            <Text style={s.rowValue}>1.0.0 · Beta</Text>
          </View>
          <TouchableOpacity style={s.row} onPress={() => Alert.alert('Liên hệ', 'Email: support@daythem.vn')}>
            <Text style={s.rowLabel}>Liên hệ hỗ trợ</Text>
            <IconChevron size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* KHÁC */}
        <SectionHeader>KHÁC</SectionHeader>
        <View style={s.card}>
          <TouchableOpacity style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={() => Alert.alert('Điều khoản', 'Tính năng đang phát triển.')}>
            <Text style={s.rowLabel}>Điều khoản & bảo mật</Text>
            <IconChevron size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={s.row} onPress={handleLogout}>
            <Text style={[s.rowLabel, { color: colors.coral700 }]}>Đăng xuất</Text>
          </TouchableOpacity>
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
  editBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: 15, fontWeight: '500', color: colors.green600 },

  profileHead: { alignItems: 'center', paddingTop: 12, paddingBottom: 20, paddingHorizontal: 20 },
  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 12, letterSpacing: -0.3 },
  role: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  editNameWrap: { marginTop: 12, width: '100%', paddingHorizontal: 20 },
  editNameInput: {
    fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3,
    borderBottomWidth: 2, borderBottomColor: colors.green500, paddingBottom: 4,
    textAlign: 'center',
  },

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
  inlineInput: {
    fontSize: 13, color: colors.textPrimary, fontWeight: '500',
    borderBottomWidth: 1.5, borderBottomColor: colors.green500,
    paddingBottom: 2, minWidth: 120, textAlign: 'right',
  },

  bankRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  bankIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' },
  bankName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  bankSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  qrBadge: { backgroundColor: colors.green100, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  qrBadgeText: { fontSize: 11, fontWeight: '600', color: colors.green700 },
  bankNote: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, paddingHorizontal: 16, paddingBottom: 14, marginTop: -4 },

  footerNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18, marginHorizontal: 32, marginTop: 8 },
});
