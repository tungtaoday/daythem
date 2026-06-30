import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Linking, ActivityIndicator, BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { IconWarn, IconZalo, IconPhone, IconCheck, IconX, IconWallet, IconChevron, IconDownload } from '../../components/icons';
import { useClassesStore } from '../../store/classes';
import { exportStudentsExcel } from '../../utils/exportExcel';
import { useAuthStore, isDemoToken } from '../../store/auth';

// ── Types & demo data ─────────────────────────────────────────

type StuItem = {
  id: string; name: string; attend: number;
  status: 'ok' | 'risk' | 'star'; debt: number; parent_phone: string | null;
  baseAmt?: number;            // học phí mặc định của lớp
  feeOverride?: number | null; // null = theo mặc định; 0 = miễn phí; số = riêng
  feeNote?: string | null;
};

const DEMO_STUS: StuItem[] = [
  { id: 's1', name: 'Nguyễn Minh Anh', attend: 100, status: 'ok',   debt: 0,      parent_phone: '091 234 5678' },
  { id: 's2', name: 'Trần Bảo Long',   attend: 75,  status: 'risk', debt: 500000, parent_phone: '098 111 2222' },
  { id: 's3', name: 'Lê Hoàng Phúc',  attend: 100, status: 'ok',   debt: 0,      parent_phone: '093 333 4444' },
  { id: 's4', name: 'Phạm Quỳnh Như', attend: 88,  status: 'ok',   debt: 500000, parent_phone: null },
  { id: 's5', name: 'Đỗ Minh Khôi',   attend: 100, status: 'star', debt: 0,      parent_phone: '097 555 6666' },
  { id: 's6', name: 'Vũ Hà My',       attend: 88,  status: 'ok',   debt: 0,      parent_phone: '096 777 8888' },
  { id: 's7', name: 'Bùi Nam Sơn',    attend: 63,  status: 'risk', debt: 500000, parent_phone: '091 999 0000' },
];

const STATUS_CFG = {
  star: { label: 'Xuất sắc ★', bg: colors.honey100, color: '#8a6d30' },
  risk: { label: 'Vắng nhiều', bg: colors.coral100, color: colors.coral700 },
  ok:   { label: 'OK',          bg: colors.green100, color: colors.green700 },
};

const DEMO_ATTEND = [
  { d: '18/05', ok: false, note: 'Bận thi' },
  { d: '11/05', ok: true },
  { d: '04/05', ok: false, note: 'Ốm' },
  { d: '27/04', ok: true },
  { d: '20/04', ok: true },
];
const DEMO_MONEY = [
  { m: 'Tháng 5/2026', amt: 500000, paid: false, date: null },
  { m: 'Tháng 4/2026', amt: 500000, paid: true,  date: '05/04' },
  { m: 'Tháng 3/2026', amt: 500000, paid: true,  date: '02/03' },
];
const VND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

// ── Student row ───────────────────────────────────────────────

function StuRow({ stu, onPress, last, isDemo }: { stu: StuItem; onPress: () => void; last?: boolean; isDemo?: boolean }) {
  const cfg = STATUS_CFG[stu.status];
  return (
    <TouchableOpacity style={[sr.row, !last && sr.divider]} onPress={onPress} activeOpacity={0.85}>
      <View style={sr.avatarWrap}>
        <Avatar name={stu.name} size={42} />
        {isDemo && stu.status === 'risk' && (
          <View style={sr.riskDot}><IconWarn size={9} color="white" /></View>
        )}
      </View>
      <View style={sr.info}>
        <Text style={sr.name} numberOfLines={1}>{stu.name}</Text>
        <Text style={sr.sub} numberOfLines={1}>
          {isDemo
            ? `${stu.attend}% chuyên cần${stu.debt > 0 ? ` · Nợ ${(stu.debt / 1000).toFixed(0)}k` : ''}`
            : (stu.parent_phone ? `PH: ${stu.parent_phone}` : 'Chưa có dữ liệu')}
        </Text>
      </View>
      {isDemo && (
        <View style={[sr.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[sr.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  riskDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 16, height: 16, borderRadius: 8, backgroundColor: colors.coral500,
    borderWidth: 2, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});

// ── Inline student profile ────────────────────────────────────

// Hero theme — màu đổi theo trạng thái (demo); tài khoản thật mặc định xanh.
const HERO = {
  ok:   { bg: colors.green600, grad: ['#55b083', '#2f6849'] as const, fg: '#ffffff', fgDim: 'rgba(255,255,255,0.78)', chipBg: 'rgba(255,255,255,0.18)', statBg: 'rgba(255,255,255,0.12)', btnBg: 'rgba(255,255,255,0.20)', label: 'Đi học đều 🌿' },
  risk: { bg: colors.coral500, grad: ['#ec8b73', '#c2593f'] as const, fg: '#ffffff', fgDim: 'rgba(255,255,255,0.82)', chipBg: 'rgba(255,255,255,0.20)', statBg: 'rgba(255,255,255,0.14)', btnBg: 'rgba(255,255,255,0.22)', label: 'Vắng nhiều' },
  star: { bg: colors.honey500, grad: ['#e9b84d', '#c8902a'] as const, fg: '#5e4715', fgDim: 'rgba(94,71,21,0.72)', chipBg: 'rgba(94,71,21,0.10)', statBg: 'rgba(255,255,255,0.42)', btnBg: 'rgba(94,71,21,0.10)', label: 'Xuất sắc ★' },
} as const;

function StudentProfile({ student, isDemo, onClose, onSetFee, className, subject }: { student: StuItem; isDemo: boolean; onClose: () => void; onSetFee?: (id: string, amt: number | null, note: string) => Promise<void>; className?: string; subject?: string }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'overview' | 'attend' | 'money'>('overview');
  const [showZalo, setShowZalo] = useState(false);
  const teacher = useAuthStore(s => s.teacher);
  const gw = teacher?.gender === 'thay' ? 'thầy' : 'cô';

  // ── Bộ đặt học phí riêng (tài khoản thật) ──
  const base = student.baseAmt ?? 0;
  const ov = student.feeOverride; // null=mặc định, 0=miễn phí, số=riêng
  const initMode: 'default' | 'free' | 'custom' = ov == null ? 'default' : ov === 0 ? 'free' : 'custom';
  const [feeMode, setFeeMode] = useState<'default' | 'free' | 'custom'>(initMode);
  const [customK, setCustomK] = useState(ov && ov > 0 ? String(Math.round(ov / 1000)) : String(Math.round(base / 1000)));
  const [feeNote, setFeeNote] = useState(student.feeNote ?? '');
  const [savingFee, setSavingFee] = useState(false);
  const [feeSaved, setFeeSaved] = useState(false);

  const saveFee = async () => {
    if (!onSetFee) return;
    const amt = feeMode === 'default' ? null : feeMode === 'free' ? 0 : Math.max(0, Math.round(Number(customK) || 0) * 1000);
    setSavingFee(true);
    try {
      await onSetFee(student.id, amt, feeNote.trim());
      setFeeSaved(true);
      setTimeout(() => setFeeSaved(false), 1800);
    } catch {
      Alert.alert('Chưa lưu được', 'Kiểm tra mạng và thử lại.');
    } finally {
      setSavingFee(false);
    }
  };
  const isRisk = isDemo && student.status === 'risk';
  const firstName = student.name.trim().split(/\s+/).pop() || student.name;

  // Hero đổi màu theo trạng thái (chỉ demo biết trạng thái thật).
  const hero = isDemo ? HERO[student.status] : HERO.ok;
  const metaLine = [className, subject].filter(Boolean).join(' · ');

  // Ghi chú: demo gợi ý theo trạng thái; tài khoản thật lấy ghi chú học phí nếu có.
  const note = isDemo
    ? (student.status === 'risk'
        ? 'Cần theo dõi: hay vắng buổi, nên nhắc phụ huynh kèm thêm ở nhà.'
        : student.status === 'star'
          ? 'Học sinh giỏi, tiếp thu nhanh — có thể giao bài nâng cao.'
          : 'Ngoan, đi học đều, tiếp thu tốt.')
    : (student.feeNote || null);

  return (
    <View style={pp.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── HERO (đổi màu theo trạng thái) ── */}
        <View style={[pp.hero, { backgroundColor: hero.bg, paddingTop: insets.top + 14 }]}>
          <LinearGradient
            colors={hero.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity style={[pp.backBtn, { backgroundColor: hero.chipBg }]} onPress={onClose}>
            <View style={{ transform: [{ rotate: '180deg' }] }}><IconChevron size={18} color={hero.fg} /></View>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <View>
              <Avatar name={student.name} size={84} ring={hero.fg} />
              {isRisk && <View style={pp.riskBadge}><IconWarn size={12} color="white" /></View>}
            </View>
            <Text style={[pp.name, { color: hero.fg }]}>{student.name}</Text>
            {metaLine ? <Text style={[pp.sub, { color: hero.fgDim }]}>{metaLine}</Text> : null}
            {isDemo && (
              <View style={[pp.statusChip, { backgroundColor: hero.chipBg }]}>
                <Text style={[pp.statusChipText, { color: hero.fg }]}>{hero.label}</Text>
              </View>
            )}

            {/* Stat row trong hero */}
            <View style={[pp.statsRow, { backgroundColor: hero.statBg }]}>
              <HeroStat fg={hero.fg} fgDim={hero.fgDim} label="Đã học" value={isDemo ? '6' : '–'} />
              <View style={[pp.statSep, { backgroundColor: hero.fgDim }]} />
              <HeroStat fg={hero.fg} fgDim={hero.fgDim} label="Vắng" value={isDemo ? '2' : '–'} />
              <View style={[pp.statSep, { backgroundColor: hero.fgDim }]} />
              <HeroStat fg={hero.fg} fgDim={hero.fgDim} label="Chuyên cần" value={isDemo ? `${student.attend}%` : '–'} />
              <View style={[pp.statSep, { backgroundColor: hero.fgDim }]} />
              <HeroStat fg={hero.fg} fgDim={hero.fgDim} label="Còn nợ" value={isDemo ? (student.debt > 0 ? VND(student.debt) : '0đ') : '–'} />
            </View>

            {/* Actions */}
            <View style={pp.actionRow}>
              <TouchableOpacity style={[pp.btnPrimary, { backgroundColor: hero.fg }]} onPress={() => setShowZalo(true)}>
                <IconZalo size={16} color={hero.bg} />
                <Text style={[pp.btnPrimaryText, { color: hero.bg }]}>Nhắn Zalo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pp.btnSecondary, { backgroundColor: hero.btnBg }]}
                onPress={() => {
                  if (student.parent_phone) {
                    Linking.openURL(`tel:${student.parent_phone.replace(/\s/g, '')}`).catch(() =>
                      Alert.alert('Không thể gọi', student.parent_phone!)
                    );
                  } else {
                    Alert.alert('Chưa có SĐT', 'Phụ huynh chưa có số điện thoại.');
                  }
                }}
              >
                <IconPhone size={16} color={hero.fg} />
                <Text style={[pp.btnSecondaryText, { color: hero.fg }]}>Gọi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={pp.tabBar}>
          {[{ id: 'overview', label: 'Tổng quan' }, { id: 'attend', label: 'Điểm danh' }, { id: 'money', label: 'Học phí' }].map(t => (
            <TouchableOpacity key={t.id} style={[pp.tab, tab === t.id && pp.tabActive]} onPress={() => setTab(t.id as any)}>
              <Text style={[pp.tabText, tab === t.id && pp.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'overview' && (
          <View style={pp.content}>
            {isRisk && (
              <View style={pp.riskCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <IconWarn size={18} color={colors.coral700} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.coral700 }}>Có dấu hiệu bỏ học</Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 20 }}>
                  Đã vắng 2 buổi trong 3 buổi gần nhất, chưa nộp tiền tháng 5.
                </Text>
              </View>
            )}
            <Text style={pp.sectionLabel}>PHỤ HUYNH</Text>
            <View style={pp.infoCard}>
              <View style={isDemo ? [pp.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.border }] : pp.infoRow}>
                <View style={pp.infoIconBox}><IconPhone size={15} color={colors.textSecondary} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={pp.infoLabel}>SĐT phụ huynh</Text>
                  <Text style={pp.infoValue}>{student.parent_phone || 'Chưa có'}</Text>
                </View>
              </View>
              {isDemo && (
                <View style={pp.infoRow}>
                  <View style={pp.infoIconBox}><IconZalo size={15} color={colors.green600} /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={pp.infoLabel}>Zalo đã kết nối</Text>
                    <Text style={pp.infoValue}>Đã đọc tin gần nhất 2h trước</Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={pp.sectionLabel}>GHI CHÚ</Text>
            {note ? (
              <View style={pp.noteCard}>
                <Text style={pp.noteText}>{note}</Text>
              </View>
            ) : (
              <View style={pp.noteCard}>
                <Text style={pp.noteEmpty}>Chưa có ghi chú. Thêm ghi chú để nhớ thông tin về em.</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'attend' && (
          <View style={pp.content}>
            {!isDemo ? (
              <View style={pp.emptyTab}>
                <Text style={pp.emptyTabTitle}>Chưa có dữ liệu điểm danh</Text>
                <Text style={pp.emptyTabSub}>Điểm danh các buổi học để xem lịch sử ở đây.</Text>
              </View>
            ) : DEMO_ATTEND.map((r, i) => (
              <View key={i} style={[pp.histRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[pp.histIcon, r.ok ? { backgroundColor: colors.green100 } : { backgroundColor: colors.coral100 }]}>
                  {r.ok ? <IconCheck size={16} color={colors.green700} /> : <IconX size={16} color={colors.coral700} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Buổi {r.d}/2026</Text>
                  {r.note && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{r.note}</Text>}
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: r.ok ? colors.green700 : colors.coral700 }}>
                  {r.ok ? 'Có mặt' : 'Vắng'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'money' && (
          <View style={pp.content}>
            {!isDemo && (
              <>
                <Text style={pp.sectionLabel}>HỌC PHÍ RIÊNG CỦA EM</Text>
                <View style={fe.card}>
                  <View style={fe.presetRow}>
                    <TouchableOpacity
                      style={[fe.preset, feeMode === 'default' && fe.presetActive]}
                      onPress={() => setFeeMode('default')}
                    >
                      <Text style={[fe.presetText, feeMode === 'default' && fe.presetTextActive]}>Mặc định</Text>
                      <Text style={fe.presetSub}>{VND(base)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[fe.preset, feeMode === 'custom' && Number(customK) * 1000 === Math.round(base / 2) && fe.presetActive]}
                      onPress={() => { setFeeMode('custom'); setCustomK(String(Math.round(base / 2 / 1000))); }}
                    >
                      <Text style={[fe.presetText, feeMode === 'custom' && Number(customK) * 1000 === Math.round(base / 2) && fe.presetTextActive]}>Giảm 50%</Text>
                      <Text style={fe.presetSub}>{VND(Math.round(base / 2))}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[fe.preset, feeMode === 'free' && fe.presetActive]}
                      onPress={() => setFeeMode('free')}
                    >
                      <Text style={[fe.presetText, feeMode === 'free' && fe.presetTextActive]}>Miễn phí</Text>
                      <Text style={fe.presetSub}>0đ</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={fe.label}>Hoặc nhập mức riêng (nghìn đ/tháng)</Text>
                  <TextInput
                    style={fe.amtInput}
                    value={feeMode === 'custom' ? customK : (feeMode === 'free' ? '0' : String(Math.round(base / 1000)))}
                    onChangeText={(v) => { setFeeMode('custom'); setCustomK(v.replace(/[^\d]/g, '')); }}
                    keyboardType="number-pad"
                    placeholder="VD: 400"
                    placeholderTextColor={colors.textMuted}
                  />

                  <TextInput
                    style={fe.noteInput}
                    value={feeNote}
                    onChangeText={setFeeNote}
                    placeholder="Ghi chú (VD: con của bạn, học bổng...)"
                    placeholderTextColor={colors.textMuted}
                  />

                  <TouchableOpacity style={[fe.saveBtn, savingFee && { opacity: 0.6 }]} onPress={saveFee} disabled={savingFee}>
                    {savingFee
                      ? <ActivityIndicator color="white" />
                      : <Text style={fe.saveText}>{feeSaved ? '✓ Đã lưu học phí' : 'Lưu học phí riêng'}</Text>}
                  </TouchableOpacity>
                </View>

                <View style={[pp.emptyTab, { paddingVertical: 24 }]}>
                  <Text style={pp.emptyTabSub}>Lịch sử nộp học phí sẽ hiện ở đây sau khi bạn thu tiền.</Text>
                </View>
              </>
            )}
            {isDemo && DEMO_MONEY.map((r, i) => (
              <View key={i} style={[pp.histRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[pp.histIcon, r.paid ? { backgroundColor: colors.green100 } : { backgroundColor: colors.coral100 }]}>
                  <IconWallet size={16} color={r.paid ? colors.green700 : colors.coral700} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{r.m}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{VND(r.amt)}{r.date ? ' · nộp ' + r.date : ''}</Text>
                </View>
                <View style={[pp.chip, r.paid ? { backgroundColor: colors.green100 } : { backgroundColor: colors.coral100 }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: r.paid ? colors.green700 : colors.coral700 }}>
                    {r.paid ? 'Đã nộp' : 'Còn thiếu'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {showZalo && (
        <ZaloCopySheet
          title={`Nhắn Zalo · ${student.name}`}
          recipient={`Phụ huynh của ${firstName}`}
          message={`Chào anh/chị, ${gw} muốn hỏi thăm bé ${firstName} ạ. Tuần này bé học như thế nào rồi? Anh/chị có điều gì muốn trao đổi thêm với ${gw} không ạ? 🌿`}
          hint={`phụ huynh của ${student.name}`}
          onConfirm={() => setShowZalo(false)}
          onClose={() => setShowZalo(false)}
        />
      )}
    </View>
  );
}

function HeroStat({ label, value, fg, fgDim }: { label: string; value: string; fg: string; fgDim: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 16, fontWeight: '800', letterSpacing: -0.3, color: fg }} numberOfLines={1}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 3, color: fgDim }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const pp = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { paddingTop: 24, paddingBottom: 22, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  backBtn: {
    position: 'absolute', top: 16, left: 16, zIndex: 2,
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginTop: 12, textAlign: 'center' },
  sub: { fontSize: 13, fontWeight: '600', marginTop: 3, textAlign: 'center' },
  statusChip: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  statusChipText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: 18, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 6 },
  statSep: { width: 1, height: 26, opacity: 0.4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16, alignSelf: 'stretch' },
  btnPrimary: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnPrimaryText: { fontSize: 14, fontWeight: '700' },
  btnSecondary: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnSecondaryText: { fontSize: 14, fontWeight: '600' },
  riskBadge: { position: 'absolute', bottom: 0, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.coral500, borderWidth: 3, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.green500 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.green700 },
  content: { padding: 20 },
  riskCard: { backgroundColor: colors.coral50, borderWidth: 1, borderColor: colors.coral100, borderRadius: 16, padding: 14, marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 8, marginTop: 8 },
  infoCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  infoIconBox: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 12, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 1 },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  histIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  emptyTab: { alignItems: 'center', paddingVertical: 32 },
  emptyTabTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptyTabSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  noteCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 },
  noteText: { fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  noteEmpty: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});

// ── Fee editor styles ─────────────────────────────────────────
const fe = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  preset: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: 'white' },
  presetActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  presetText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  presetTextActive: { color: colors.green700 },
  presetSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  amtInput: { backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 13, fontSize: 16, color: colors.textPrimary, marginBottom: 12 },
  noteInput: { backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 13, fontSize: 14, color: colors.textPrimary, marginBottom: 14 },
  saveBtn: { backgroundColor: colors.green500, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: 'white', fontSize: 15, fontWeight: '700' },
});

// ── Main screen ───────────────────────────────────────────────

export function ClassStudentsScreen({ route, navigation }: any) {
  const { classId, className } = route.params;
  const openStudentId: string | undefined = route.params?.openStudentId;
  const { classes, students, fetchStudents, addStudent, setStudentFee } = useClassesStore();
  const isDemo = isDemoToken(useAuthStore(st => st.token));

  const klass = classes.find(c => c.id === classId);
  const baseFee = klass?.default_fee ?? 0;
  const classStudents = students[classId] || [];

  const displayStus: StuItem[] = isDemo
    ? DEMO_STUS
    : classStudents.map(s => {
        const fs = (s as any).fee_setting as { fee_type: string; amount: number | null; note: string | null } | null;
        const override = !fs || fs.fee_type === 'default' ? null
          : fs.fee_type === 'free' ? 0
          : (fs.amount ?? null);
        return {
          id: s.id, name: s.name, attend: 0, status: 'ok' as const,
          debt: 0, parent_phone: s.parent_phone ?? null,
          baseAmt: baseFee, feeOverride: override, feeNote: fs?.note ?? null,
        };
      });

  // Lưu học phí riêng cho 1 học sinh (null = theo mặc định lớp).
  const handleSetFee = async (studentId: string, amt: number | null, note: string) => {
    const feeType = amt === null ? 'default'
      : amt === 0 ? 'free'
      : amt < baseFee ? 'discount'
      : 'custom';
    await setStudentFee(studentId, {
      fee_type: feeType,
      amount: amt !== null ? amt : undefined,
      note: note || undefined,
    });
    await fetchStudents(classId);
  };

  const [profileStu, setProfileStu] = useState<StuItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addParentName, setAddParentName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addNote, setAddNote] = useState('');
  const [loading, setLoading] = useState(!isDemo);

  const resetAddForm = () => { setAddName(''); setAddParentName(''); setAddPhone(''); setAddNote(''); };

  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    setLoading(true);
    Promise.resolve(fetchStudents(classId)).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [classId, isDemo]);

  // Mở thẳng hồ sơ 1 em khi điều hướng kèm openStudentId (từ Chi tiết lớp).
  useEffect(() => {
    if (!openStudentId) return;
    const target = displayStus.find(st => st.id === openStudentId);
    if (target) {
      setProfileStu(target);
      navigation.setParams({ openStudentId: undefined });
    }
  }, [openStudentId, displayStus.length]);

  // Đang xem hồ sơ → ẩn header gốc + nút back Android đóng hồ sơ (không thoát lớp).
  useEffect(() => {
    navigation.setOptions({ headerShown: !profileStu });
    if (!profileStu) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setProfileStu(null); return true; });
    return () => sub.remove();
  }, [profileStu]);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    try {
      await addStudent(classId, {
        name: addName.trim(),
        parent_name: addParentName.trim() || null,
        parent_phone: addPhone.trim() || null,
        note: addNote.trim() || null,
      });
      resetAddForm();
      setShowAdd(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm học sinh.');
    }
  };

  if (profileStu) {
    return <StudentProfile student={profileStu} isDemo={isDemo} onClose={() => setProfileStu(null)} onSetFee={handleSetFee} className={className} subject={klass?.subject} />;
  }

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={colors.green500} size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>

        {/* Summary bar */}
        <View style={s.summaryBar}>
          <Text style={s.summaryText}>{displayStus.length} học sinh</Text>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {displayStus.length > 0 && (
              <TouchableOpacity
                style={s.exportBtn}
                onPress={() => exportStudentsExcel(
                  displayStus.map(st => ({
                    name: st.name,
                    parent_phone: st.parent_phone,
                    attend: st.attend,
                    debt: st.debt,
                  })),
                  className
                )}
              >
                <IconDownload size={14} color={colors.green700} />
                <Text style={s.exportBtnText}>Xuất Excel</Text>
              </TouchableOpacity>
            )}
            {!isDemo && (
              <TouchableOpacity onPress={() => setShowAdd(true)}>
                <Text style={s.addLink}>+ Thêm</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Student list */}
        {displayStus.length > 0 ? (
          <View style={s.card}>
            {displayStus.map((stu, i) => (
              <StuRow
                key={stu.id}
                stu={stu}
                isDemo={isDemo}
                last={i === displayStus.length - 1}
                onPress={() => setProfileStu(stu)}
              />
            ))}
          </View>
        ) : (
          <TouchableOpacity style={s.emptyCard} onPress={() => setShowAdd(true)}>
            <Text style={s.emptyText}>+ Thêm học sinh đầu tiên vào lớp</Text>
          </TouchableOpacity>
        )}

        {!isDemo && displayStus.length > 0 && (
          <TouchableOpacity style={s.addInlineBtn} onPress={() => setShowAdd(true)}>
            <Text style={s.addInlineBtnText}>+ Thêm học sinh vào {className}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add student modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Thêm học sinh</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); resetAddForm(); }}>
              <Text style={s.modalClose}>Huỷ</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.fieldLabel}>Tên học sinh *</Text>
          <TextInput
            style={s.input} placeholder="VD: Nguyễn Minh An"
            placeholderTextColor={colors.textMuted}
            value={addName} onChangeText={setAddName} autoFocus
          />
          <Text style={s.fieldLabel}>Tên phụ huynh</Text>
          <TextInput
            style={s.input} placeholder="VD: Chị Hương (mẹ An)"
            placeholderTextColor={colors.textMuted}
            value={addParentName} onChangeText={setAddParentName}
          />
          <Text style={s.fieldLabel}>SĐT phụ huynh (Zalo)</Text>
          <TextInput
            style={s.input} placeholder="VD: 0901 234 567"
            placeholderTextColor={colors.textMuted}
            value={addPhone} onChangeText={setAddPhone} keyboardType="phone-pad"
          />
          <Text style={s.fieldLabel}>Ghi chú</Text>
          <TextInput
            style={[s.input, { height: 72, textAlignVertical: 'top' }]} placeholder="VD: Học sinh cũ, ưu tiên chỗ ngồi gần bảng..."
            placeholderTextColor={colors.textMuted}
            value={addNote} onChangeText={setAddNote} multiline
          />
          <TouchableOpacity
            style={[s.saveBtn, !addName.trim() && { opacity: 0.5 }]}
            onPress={handleAdd} disabled={!addName.trim()}
          >
            <Text style={s.saveBtnText}>Thêm học sinh</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  list: { padding: 16, paddingTop: 8 },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  summaryText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  addLink: { fontSize: 14, fontWeight: '600', color: colors.green600 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  emptyCard: { backgroundColor: colors.green50, borderRadius: 14, borderWidth: 1, borderColor: colors.green200, paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '600', color: colors.green600 },
  addInlineBtn: { marginTop: 10, paddingVertical: 10, alignItems: 'center' },
  addInlineBtnText: { fontSize: 13, color: colors.green600, fontWeight: '600' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, borderWidth: 1, borderColor: colors.green200, backgroundColor: colors.green50 },
  exportBtnText: { fontSize: 12, fontWeight: '600', color: colors.green700 },
  modal: { flex: 1, padding: 24, backgroundColor: colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  modalClose: { fontSize: 16, color: colors.green600, fontWeight: '600' },
  input: { backgroundColor: 'white', borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 12, color: colors.textPrimary },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginLeft: 2 },
  saveBtn: { backgroundColor: colors.green500, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
