import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { IconZalo, IconWallet, IconChevron } from '../../components/icons';
import { useClassesStore } from '../../store/classes';

// ── Types ─────────────────────────────────────────────────────

type FeeMode = 'month' | 'session' | 'course';

type StuFee = {
  id: string; name: string; baseAmt: number;
  override: number | null; overrideNote: string | null;
};

// ── Demo fallback (used when students not yet fetched from API) ─

const DEMO_STUS: StuFee[] = [
  { id: 's1', name: 'Nguyễn Minh Anh',  baseAmt: 500000, override: null, overrideNote: null },
  { id: 's2', name: 'Trần Bảo Long',    baseAmt: 500000, override: null, overrideNote: null },
  { id: 's3', name: 'Lê Hoàng Phúc',    baseAmt: 500000, override: 250000, overrideNote: 'Con của bạn cô' },
  { id: 's4', name: 'Phạm Quỳnh Như',   baseAmt: 500000, override: null, overrideNote: null },
  { id: 's5', name: 'Đỗ Minh Khôi',     baseAmt: 500000, override: 0,      overrideNote: 'Học bổng xuất sắc' },
  { id: 's6', name: 'Vũ Hà My',         baseAmt: 500000, override: null, overrideNote: null },
  { id: 's7', name: 'Bùi Nam Sơn',      baseAmt: 500000, override: 600000, overrideNote: 'Phụ đạo cuối tuần' },
];

// ── Sub-components ────────────────────────────────────────────

function SectionHeader({ children }: { children: string }) {
  return <Text style={s.sectionHeader}>{children}</Text>;
}

function FeeTag({ override, base, note }: { override: number | null; base: number; note: string | null }) {
  if (override === null) {
    return <Text style={[s.feeTag, { color: colors.textSecondary }]}>{(base / 1000).toFixed(0)}k</Text>;
  }
  if (override === 0) {
    return (
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[s.feeBadge, { backgroundColor: colors.honey100 }]}>
          <Text style={[s.feeBadgeText, { color: '#8a6d30' }]}>Miễn phí</Text>
        </View>
        {note && <Text style={s.feeNote}>{note}</Text>}
      </View>
    );
  }
  const label = override < base ? `Giảm ${Math.round((1 - override / base) * 100)}%` : 'Tuỳ chỉnh';
  const badgeColor = override < base ? colors.coral700 : colors.green700;
  const badgeBg = override < base ? colors.coral100 : colors.green100;
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[s.feeTag, { color: colors.textPrimary }]}>{(override / 1000).toFixed(0)}k</Text>
      <View style={[s.feeBadge, { backgroundColor: badgeBg }]}>
        <Text style={[s.feeBadgeText, { color: badgeColor }]}>{label}</Text>
      </View>
      {note && <Text style={s.feeNote}>{note}</Text>}
    </View>
  );
}

// ── Fee editor modal ──────────────────────────────────────────

function FeeModal({ stu, base, onSave, onClose }: any) {
  const [val, setVal] = useState(stu.override !== null ? String(stu.override / 1000) : String(base / 1000));
  const [note, setNote] = useState(stu.overrideNote || '');
  const PRESETS = [
    { label: 'Mặc định', amt: base },
    { label: 'Giảm 50%', amt: Math.round(base / 2) },
    { label: 'Miễn phí', amt: 0 },
  ];
  return (
    <TouchableOpacity style={s.overlay} onPress={onClose} activeOpacity={1}>
      <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={() => {}}>
        <View style={s.handle} />
        <Text style={s.sheetTitle}>Học phí · {stu.name.split(' ').slice(-1)[0]}</Text>
        <Text style={s.sheetSub}>Mặc định: {(base / 1000).toFixed(0)}k/tháng</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p.label}
              style={[s.presetChip, Number(val) * 1000 === p.amt && s.presetChipActive]}
              onPress={() => setVal(String(p.amt / 1000))}
            >
              <Text style={[s.presetChipText, Number(val) * 1000 === p.amt && { color: colors.green700 }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.amtRow}>
          <TextInput
            style={s.amtInput}
            value={val}
            onChangeText={setVal}
            keyboardType="numeric"
            placeholder="500"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={s.amtUnit}>nghìn đồng / tháng</Text>
        </View>
        <TextInput
          style={s.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Ghi chú (tuỳ chọn)..."
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => onSave(Number(val) * 1000, note)}
        >
          <Text style={s.btnPrimaryText}>Lưu</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────

export function ClassSettingsScreen({ route, navigation }: any) {
  const { classId } = route.params;
  const { classes, students, fetchStudents, updateClass, setStudentFee } = useClassesStore();

  const klass = classes.find(c => c.id === classId);
  const classStudents = students[classId] || [];
  const isDemo = classes.length === 0;

  const [className, setClassName] = useState(klass?.name ?? 'Lớp 9');
  const [subject, setSubject] = useState(klass?.subject ?? 'Toán');
  const [defaultFee, setDefaultFee] = useState(klass?.default_fee ?? 500000);
  const [feeMode, setFeeMode] = useState<FeeMode>((klass?.fee_type as FeeMode) ?? 'month');
  const [stus, setStus] = useState<StuFee[]>(DEMO_STUS);
  const [editingStu, setEditingStu] = useState<StuFee | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchStudents(classId); }, [classId]);

  // Sync student list when real students load from API
  useEffect(() => {
    if (classStudents.length > 0) {
      setStus(classStudents.map(stu => ({
        id: stu.id,
        name: stu.name,
        baseAmt: klass?.default_fee ?? 500000,
        override: (stu.fee_setting as any)?.override ?? null,
        overrideNote: (stu.fee_setting as any)?.note ?? null,
      })));
    }
  }, [classStudents.length, klass?.default_fee]);

  const customCount = stus.filter(s => s.override !== null).length;

  const handleStuFee = async (amt: number, note: string) => {
    if (!editingStu) return;
    const newOverride = amt === defaultFee ? null : amt;
    setStus(prev => prev.map(s =>
      s.id === editingStu.id
        ? { ...s, override: newOverride, overrideNote: note || null }
        : s
    ));
    if (!isDemo) {
      await setStudentFee(editingStu.id, { override: newOverride, note: note || null }).catch(() => {});
    }
    setEditingStu(null);
  };

  const handleSave = async () => {
    if (isDemo) return;
    try {
      await updateClass(classId, {
        name: className,
        subject,
        default_fee: defaultFee,
        fee_type: feeMode,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu thay đổi. Kiểm tra kết nối mạng.');
    }
  };

  const handleArchive = () => {
    Alert.alert(
      'Lưu trữ lớp học?',
      'Lớp sẽ bị ẩn khỏi danh sách chính. Dữ liệu điểm danh và học phí vẫn được giữ nguyên.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Lưu trữ', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── THÔNG TIN LỚP ── */}
        <SectionHeader>THÔNG TIN LỚP</SectionHeader>
        <View style={s.card}>
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={s.rowLabel}>Tên lớp</Text>
            <TextInput
              style={s.inlineInput}
              value={className}
              onChangeText={setClassName}
              placeholder="Lớp 9"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              editable={!isDemo}
            />
          </View>
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={s.rowLabel}>Môn học</Text>
            <TextInput
              style={s.inlineInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Toán"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              editable={!isDemo}
            />
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Màu sắc</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['#4a9e72', '#e07a5f', '#6b7fd7', '#e8a838', '#9b6bb5'].map(col => (
                <TouchableOpacity key={col} style={[s.colorDot, { backgroundColor: col }]}>
                  <View style={[s.colorDotInner, { backgroundColor: col === '#4a9e72' ? 'white' : 'transparent' }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── LỊCH HỌC ĐỊNH KỲ ── */}
        <SectionHeader>LỊCH HỌC ĐỊNH KỲ</SectionHeader>
        <View style={s.card}>
          <View style={[s.scheduleRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={s.scheduleDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.scheduleDay}>Thứ 4 · 18:30</Text>
              <Text style={s.scheduleSub}>1h 30p · Tại nhà</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Sửa lịch', 'Tính năng đang phát triển.')}>
              <IconChevron size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={s.addScheduleBtn}
            onPress={() => Alert.alert('Thêm buổi', 'Tính năng đang phát triển.')}
          >
            <Text style={s.addScheduleBtnText}>+ Thêm buổi định kỳ</Text>
          </TouchableOpacity>
        </View>

        {/* ── HỌC PHÍ MẶC ĐỊNH ── */}
        <SectionHeader>HỌC PHÍ MẶC ĐỊNH</SectionHeader>
        <View style={s.card}>
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={s.feeAmt}>{defaultFee.toLocaleString('vi-VN')}đ / tháng</Text>
            <Text style={s.feeMeta}>4 buổi/tháng · {(defaultFee / 4 / 1000).toFixed(0)}k/buổi</Text>
          </View>
          <View style={s.row}>
            <Text style={[s.rowLabel, { marginBottom: 0 }]}>Cách tính</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([['month', 'Theo tháng'], ['session', 'Theo buổi'], ['course', 'Theo khoá']] as [FeeMode, string][]).map(([id, label]) => (
                <TouchableOpacity
                  key={id}
                  style={[s.modeChip, feeMode === id && s.modeChipActive]}
                  onPress={() => setFeeMode(id)}
                >
                  <Text style={[s.modeChipText, feeMode === id && s.modeChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── HỌC PHÍ TỪNG HỌC SINH ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, marginTop: 20 }}>
          <Text style={[s.sectionHeader, { margin: 0, flex: 1 }]}>HỌC PHÍ TỪNG HỌC SINH</Text>
          {customCount > 0 && (
            <View style={s.customBadge}>
              <Text style={s.customBadgeText}>{customCount} cá biệt</Text>
            </View>
          )}
        </View>
        <Text style={s.stuFeeHint}>
          {isDemo
            ? 'Mẫu dữ liệu · kết nối API để xem học sinh thực'
            : `Mặc định kế thừa ${(defaultFee / 1000).toFixed(0)}k. Chạm để đặt mức riêng.`}
        </Text>
        <View style={s.card}>
          {stus.map((stu, i) => (
            <TouchableOpacity
              key={stu.id}
              style={[s.stuRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
              onPress={() => setEditingStu(stu)}
              activeOpacity={0.8}
            >
              <Avatar name={stu.name} size={34} />
              <Text style={s.stuName} numberOfLines={1}>{stu.name}</Text>
              <FeeTag override={stu.override} base={defaultFee} note={stu.overrideNote} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── NHÓM ZALO ── */}
        <SectionHeader>NHÓM ZALO</SectionHeader>
        <View style={s.card}>
          {klass?.zalo_group_id ? (
            <View style={s.zaloRow}>
              <View style={s.zaloIcon}>
                <IconZalo size={20} color="#3a7dd3" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.zaloName}>Zalo {klass.name}</Text>
                <Text style={s.zaloBadgeText}>Đã liên kết · Đang hoạt động</Text>
              </View>
              <IconChevron size={16} color={colors.textMuted} />
            </View>
          ) : (
            <TouchableOpacity
              style={s.zaloRow}
              onPress={() => Alert.alert('Liên kết Zalo', 'Tính năng đang phát triển.')}
            >
              <View style={[s.zaloIcon, { backgroundColor: colors.surfaceAlt }]}>
                <IconZalo size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.zaloName}>Chưa liên kết nhóm Zalo</Text>
                <Text style={s.zaloBadgeText}>Nhấn để kết nối nhóm phụ huynh</Text>
              </View>
              <IconChevron size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── LƯU THAY ĐỔI ── */}
        <TouchableOpacity
          style={[s.saveBtn, isDemo && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={isDemo}
        >
          <Text style={s.saveBtnText}>{saved ? '✓ Đã lưu' : 'Lưu thay đổi'}</Text>
        </TouchableOpacity>

        {/* ── Danger zone ── */}
        <View style={[s.card, { marginTop: 8 }]}>
          <TouchableOpacity style={[s.row, { justifyContent: 'center' }]} onPress={handleArchive}>
            <Text style={[s.rowLabel, { color: colors.coral700, textAlign: 'center', flex: 0 }]}>Lưu trữ lớp này</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fee edit modal */}
      {editingStu && (
        <FeeModal
          stu={editingStu}
          base={defaultFee}
          onSave={handleStuFee}
          onClose={() => setEditingStu(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.4, marginBottom: 8, marginHorizontal: 16, marginTop: 20,
  },
  card: {
    backgroundColor: 'white', borderRadius: 18,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 10, minHeight: 52 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, flex: 1 },
  rowValue: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  inlineInput: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, flex: 1, textAlign: 'right' },
  colorDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  colorDotInner: { width: 8, height: 8, borderRadius: 4 },

  scheduleRow: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, gap: 12 },
  scheduleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green500 },
  scheduleDay: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  scheduleSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  addScheduleBtn: { paddingVertical: 13, paddingHorizontal: 16 },
  addScheduleBtnText: { fontSize: 14, fontWeight: '600', color: colors.green600 },

  feeAmt: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4 },
  feeMeta: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  modeChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white' },
  modeChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  modeChipText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  modeChipTextActive: { color: colors.green700 },

  customBadge: { backgroundColor: colors.coral100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  customBadgeText: { fontSize: 11, fontWeight: '700', color: colors.coral700 },
  stuFeeHint: { fontSize: 12, color: colors.textSecondary, marginHorizontal: 16, marginBottom: 8 },
  stuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  stuName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  feeTag: { fontSize: 14, fontWeight: '600' },
  feeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, marginTop: 2 },
  feeBadgeText: { fontSize: 10, fontWeight: '700' },
  feeNote: { fontSize: 10, color: colors.textSecondary, marginTop: 1, maxWidth: 100 },

  zaloRow: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, gap: 12 },
  zaloIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e8f2fb', alignItems: 'center', justifyContent: 'center' },
  zaloName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  zaloBadgeText: { fontSize: 12, color: colors.textSecondary },

  saveBtn: { marginHorizontal: 16, marginTop: 20, height: 52, borderRadius: 16, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,30,25,0.4)', justifyContent: 'flex-end' } as any,
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 36 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0ddd5', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  sheetSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 14 },
  presetChip: { flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: 'white' },
  presetChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  presetChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  amtRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  amtInput: { flex: 0, width: 96, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, fontSize: 20, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  amtUnit: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  noteInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, fontSize: 14, marginBottom: 14, color: colors.textPrimary },
  btnPrimary: { height: 52, borderRadius: 16, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
