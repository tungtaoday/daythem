import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore, Gender } from '../../store/auth';
import { changePassword, deleteAccount } from '../../api/auth';
import { useClassesStore } from '../../store/classes';
import { storage } from '../../store/storage';
import { IconChevron, IconWallet } from '../../components/icons';

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

// ── Change password modal ─────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const valid = current.length >= 4 && next.length >= 6 && next === confirm;

  const handleSave = async () => {
    if (next !== confirm) { Alert.alert('Mật khẩu không khớp', 'Mật khẩu mới và xác nhận phải giống nhau.'); return; }
    if (next.length < 6) { Alert.alert('Quá ngắn', 'Mật khẩu mới phải có ít nhất 6 ký tự.'); return; }
    setSaving(true);
    try {
      await changePassword(current, next);
      setDone(true);
      setTimeout(onClose, 1400);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Không đổi được mật khẩu. Kiểm tra mạng và thử lại.';
      Alert.alert('Chưa đổi được', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TouchableOpacity style={cp.overlay} onPress={onClose} activeOpacity={1}>
      <TouchableOpacity style={cp.sheet} activeOpacity={1} onPress={() => {}}>
        <View style={cp.handle} />
        {done ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>✓</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.green700 }}>Đã đổi mật khẩu!</Text>
          </View>
        ) : (
          <>
            <Text style={cp.title}>Đổi mật khẩu</Text>
            <Text style={cp.label}>Mật khẩu hiện tại</Text>
            <TextInput style={cp.input} value={current} onChangeText={setCurrent} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.textMuted} />
            <Text style={cp.label}>Mật khẩu mới</Text>
            <TextInput style={cp.input} value={next} onChangeText={setNext} secureTextEntry placeholder="Tối thiểu 6 ký tự" placeholderTextColor={colors.textMuted} />
            <Text style={cp.label}>Xác nhận mật khẩu mới</Text>
            <TextInput
              style={[cp.input, confirm.length > 0 && next !== confirm && { borderColor: colors.coral500 }]}
              value={confirm} onChangeText={setConfirm} secureTextEntry
              placeholder="Nhập lại mật khẩu mới" placeholderTextColor={colors.textMuted}
            />
            {confirm.length > 0 && next !== confirm && (
              <Text style={{ fontSize: 12, color: colors.coral700, marginTop: -10, marginBottom: 10 }}>Mật khẩu không khớp</Text>
            )}
            <TouchableOpacity style={[cp.btn, (!valid || saving) && cp.btnDisabled]} onPress={handleSave} disabled={!valid || saving}>
              <Text style={cp.btnText}>{saving ? 'Đang lưu…' : 'Lưu mật khẩu mới'}</Text>
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
const cp = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,30,25,0.4)', justifyContent: 'flex-end' } as any,
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 36 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0ddd5', alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.2, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: 13, fontSize: 15, color: colors.textPrimary, marginBottom: 14, backgroundColor: 'white' },
  btn: { height: 52, borderRadius: 16, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});

// ── Main screen ───────────────────────────────────────────────

export function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { teacher, logout, updateProfile, setGender } = useAuthStore();
  const { classes } = useClassesStore();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(teacher?.name || '');
  const [editPhone, setEditPhone] = useState(teacher?.phone || '');
  const [editEmail, setEditEmail] = useState('');
  const [editGender, setEditGender] = useState<Gender>(teacher?.gender ?? 'co');
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Bank info state — persisted locally (backend has no bank fields yet)
  const [bankName, setBankName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankHolder, setBankHolder] = useState('');

  // Load locally-saved email + bank info on mount
  useEffect(() => {
    (async () => {
      const [em, bn, bnum, bh] = await Promise.all([
        storage.get('profile_email'),
        storage.get('bank_name'),
        storage.get('bank_number'),
        storage.get('bank_holder'),
      ]);
      if (em) setEditEmail(em);
      if (bn) setBankName(bn);
      if (bnum) setBankNumber(bnum);
      if (bh) setBankHolder(bh);
    })();
  }, []);

  const totalStudents = classes.reduce((a, c) => a + (c.student_count || 0), 0);
  const gender = teacher?.gender ?? 'co';
  const title = gender === 'co' ? 'Cô giáo' : 'Thầy giáo';
  const displayName = teacher?.name || title;
  const hasBank = !!(bankName && bankNumber);

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
      // Email + bank are stored locally (no backend fields yet)
      await Promise.all([
        storage.set('profile_email', editEmail.trim()),
        storage.set('bank_name', bankName.trim()),
        storage.set('bank_number', bankNumber.trim()),
        storage.set('bank_holder', bankHolder.trim()),
      ]);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => { logout(); } },
    ]);
  };

  const isDemo = !teacher || teacher.id === 'demo';
  const handleDeleteAccount = () => {
    Alert.alert(
      'Xoá tài khoản',
      'Toàn bộ lớp, học sinh, điểm danh, học phí của bạn sẽ bị xoá vĩnh viễn và KHÔNG thể khôi phục. Bạn chắc chắn?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá vĩnh viễn', style: 'destructive',
          onPress: () => {
            Alert.alert('Xác nhận lần cuối', 'Nhấn "Xoá" để xoá tài khoản ngay.', [
              { text: 'Huỷ', style: 'cancel' },
              {
                text: 'Xoá', style: 'destructive',
                onPress: async () => {
                  try {
                    if (!isDemo) await deleteAccount();
                    await logout();
                  } catch {
                    Alert.alert('Chưa xoá được', 'Kiểm tra mạng và thử lại.');
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <View style={s.container}>
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
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
          <Text style={s.role}>{title}</Text>

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
          <StatItem value={String(classes.length)} label="Lớp đang dạy" />
          <View style={s.statsDivider} />
          <StatItem value={String(totalStudents)} label="Học sinh" />
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
              : <Text style={[s.rowValue, !(teacher?.phone || editPhone) && { color: colors.textMuted }]}>{teacher?.phone || editPhone || 'Chưa thiết lập'}</Text>}
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
              : <Text style={[s.rowValue, !editEmail && { color: colors.textMuted }]}>{editEmail || 'Chưa thiết lập'}</Text>}
          </View>
          <TouchableOpacity style={s.row} onPress={() => setShowPwd(true)}>
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
              {editing ? (
                <>
                  <TextInput
                    style={s.bankInput}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="Tên ngân hàng"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={[s.bankInput, { marginTop: 6 }]}
                    value={bankNumber}
                    onChangeText={setBankNumber}
                    placeholder="Số tài khoản"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </>
              ) : hasBank ? (
                <Text style={s.bankName}>{bankName} · {bankNumber}</Text>
              ) : (
                <Text style={[s.bankName, { color: colors.textMuted }]}>Chưa thiết lập tài khoản nhận tiền</Text>
              )}
              {editing ? (
                <TextInput
                  style={[s.bankInput, { marginTop: 6 }]}
                  value={bankHolder}
                  onChangeText={setBankHolder}
                  placeholder="Tên chủ tài khoản"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
              ) : hasBank && bankHolder ? (
                <Text style={s.bankSub}>Tên chủ TK: {bankHolder}</Text>
              ) : null}
            </View>
          </View>
          <Text style={s.bankNote}>
            Phụ huynh sẽ thấy thông tin này trong tin nhắn nộp tiền
          </Text>
        </View>

        {/* THUẾ */}
        <SectionHeader>THUẾ THU NHẬP CÁ NHÂN</SectionHeader>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => navigation.navigate('Tax')}>
            <Text style={s.rowLabel}>Thuế TNCN & tờ khai 09/KK-TNCN</Text>
            <IconChevron size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* THÔNG BÁO */}
        <SectionHeader>THÔNG BÁO</SectionHeader>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => navigation.navigate('NotificationSettings')}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Cài đặt thông báo</Text>
              <Text style={s.rowSub}>Nhắc buổi học, học phí, báo cáo · Không làm phiền</Text>
            </View>
            <IconChevron size={16} color={colors.textMuted} />
          </TouchableOpacity>
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
          <TouchableOpacity style={s.row} onPress={() => Alert.alert('Liên hệ', 'Email: support@gieochu.vn')}>
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
          <TouchableOpacity style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={handleLogout}>
            <Text style={[s.rowLabel, { color: colors.coral700 }]}>Đăng xuất</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.row} onPress={handleDeleteAccount}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, { color: colors.coral700 }]}>Xoá tài khoản</Text>
              <Text style={s.rowSub}>Xoá vĩnh viễn mọi dữ liệu</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={s.footerNote}>
          Lớp & học sinh được lưu trên máy chủ.{'\n'}Email & tài khoản ngân hàng lưu trên máy này.
        </Text>
      </ScrollView>

      {showPwd && <ChangePasswordModal onClose={() => setShowPwd(false)} />}
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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  soonBadge: { backgroundColor: colors.honey100, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  soonBadgeText: { fontSize: 10, fontWeight: '700', color: '#8a6d30' },
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

  bankRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  bankIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bankName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  bankSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bankInput: {
    fontSize: 14, fontWeight: '500', color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.bg,
  },
  qrBadge: { backgroundColor: colors.green100, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  qrBadgeText: { fontSize: 11, fontWeight: '600', color: colors.green700 },
  bankNote: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, paddingHorizontal: 16, paddingBottom: 14, marginTop: -4 },

  footerNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18, marginHorizontal: 32, marginTop: 8 },
});
