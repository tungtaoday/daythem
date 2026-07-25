import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { IconZalo, IconWallet, IconChevron, IconCheck } from '../../components/icons';
import { useClassesStore } from '../../store/classes';
import { CLASS_COLORS, CLASS_COLOR_KEYS, ClassColorKey } from '../../theme/classColors';
import { useAuthStore, isDemoToken } from '../../store/auth';
import { getSessions, sessionTimeStr, DAY_SHORT, Session } from '../../utils/schedule';
import { FEE_TYPES, FEE_UNIT, normFeeType } from '../../utils/feeTypes';

// ── Types ─────────────────────────────────────────────────────

type FeeMode = 'month' | 'session' | 'course';

// ── Schedule editor presets ───────────────────────────────────

const TIME_PRESETS = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
const DUR_PRESETS: { l: string; v: number }[] = [
  { l: '60p', v: 60 }, { l: '1h30', v: 90 }, { l: '2h', v: 120 }, { l: '2h30', v: 150 },
];
const PLACE_PRESETS = ['Tại nhà', 'Zoom', 'Quán cà phê', 'Khác'];
const DAY_CHIPS: { l: string; v: number }[] = [
  { l: 'T2', v: 1 }, { l: 'T3', v: 2 }, { l: 'T4', v: 3 }, { l: 'T5', v: 4 },
  { l: 'T6', v: 5 }, { l: 'T7', v: 6 }, { l: 'CN', v: 7 },
];

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

function ZaloLinkModal({ current, onSave, onClose }: any) {
  const [val, setVal] = useState(current || '');
  const link = val.trim();
  return (
    <TouchableOpacity style={s.overlay} onPress={onClose} activeOpacity={1}>
      <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={() => {}}>
        <View style={s.handle} />
        <Text style={s.sheetTitle}>Nhóm Zalo của lớp</Text>
        <Text style={s.sheetSub}>Dán link nhóm Zalo phụ huynh để mở nhanh khi gửi báo cáo / nhắc học phí. App không tự tạo nhóm hay tự gửi — bạn vẫn chủ động gửi trong Zalo.</Text>
        <TextInput
          style={[s.noteInput, { marginTop: 12 }]}
          value={val}
          onChangeText={setVal}
          placeholder="https://zalo.me/g/..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="url"
        />
        {!!link && (
          <TouchableOpacity
            style={[s.zaloRow, { paddingHorizontal: 0 }]}
            onPress={() => Linking.openURL(link).catch(() => Alert.alert('Không mở được', 'Kiểm tra lại link nhóm Zalo.'))}
          >
            <View style={s.zaloIcon}><IconZalo size={18} color={colors.zalo} /></View>
            <Text style={[s.zaloName, { flex: 1 }]}>Mở thử nhóm Zalo</Text>
            <IconChevron size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.btnPrimary} onPress={() => onSave(link)}>
          <Text style={s.btnPrimaryText}>{link ? 'Lưu link nhóm' : 'Xoá link'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function FeeTag({ override, base, note }: { override: number | null; base: number; note: string | null }) {
  if (override === null) {
    return <Text style={[s.feeTag, { color: colors.textSecondary }]}>{(base / 1000).toFixed(0)}k</Text>;
  }
  if (override === 0) {
    return (
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[s.feeBadge, { backgroundColor: colors.honey100 }]}>
          <Text style={[s.feeBadgeText, { color: colors.honey700 }]}>Miễn phí</Text>
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

function FeeModal({ stu, base, unit, onSave, onClose }: any) {
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
        <Text style={s.sheetSub}>Mặc định: {(base / 1000).toFixed(0)}k/{unit || 'tháng'}</Text>
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
  const insets = useSafeAreaInsets();
  const { classes, students, fetchStudents, updateClass, setStudentFee } = useClassesStore();
  const isDemo = isDemoToken(useAuthStore(st => st.token));

  const klass = classes.find(c => c.id === classId);
  const classStudents = students[classId] || [];
  const [loadingStus, setLoadingStus] = useState(!isDemo);

  const sched = (klass as any)?.schedule ?? null;
  const schedSessions = getSessions(sched);
  // Mỗi buổi 1 dòng: "T4 · 18:30 – 20:00 · Tại nhà"
  const scheduleLines = schedSessions.map(sess =>
    [DAY_SHORT[sess.day], sessionTimeStr(sess), sess.location].filter(Boolean).join(' · ')
  );

  const [className, setClassName] = useState(klass?.name ?? 'Lớp 9');
  const [subject, setSubject] = useState(klass?.subject ?? 'Toán');
  const [defaultFee, setDefaultFee] = useState(klass?.default_fee ?? 500000);
  const [feeInput, setFeeInput] = useState(String(Math.round((klass?.default_fee ?? 500000) / 1000)));
  const [feeMode, setFeeMode] = useState<FeeMode>((klass?.fee_type as FeeMode) ?? 'month');
  const [color, setColor] = useState<ClassColorKey>(((klass?.color as ClassColorKey) ?? 'green'));
  const [stus, setStus] = useState<StuFee[]>(isDemo ? DEMO_STUS : []);
  const [editingStu, setEditingStu] = useState<StuFee | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Sửa lịch học (mỗi buổi có giờ/thời lượng/địa điểm RIÊNG) ──
  const initSessions = (): Session[] => {
    const s = getSessions(sched);
    return s.length ? s : [{ day: 3, start_time: '18:30', duration: 90, location: 'Tại nhà' }];
  };
  const [showSched, setShowSched] = useState(false);
  const [showZaloLink, setShowZaloLink] = useState(false);
  const [edSessions, setEdSessions] = useState<Session[]>(initSessions);
  const [savingSched, setSavingSched] = useState(false);

  const openSchedEdit = () => {
    setEdSessions(initSessions());
    setShowSched(true);
  };

  const patchSession = (idx: number, patch: Partial<Session>) =>
    setEdSessions(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const removeSession = (idx: number) =>
    setEdSessions(prev => prev.filter((_, i) => i !== idx));

  const addSession = () =>
    setEdSessions(prev => {
      const used = new Set(prev.map(s => s.day));
      const nextDay = DAY_CHIPS.map(d => d.v).find(v => !used.has(v)) ?? 3;
      return [...prev, { day: nextDay, start_time: '18:30', duration: 90, location: 'Tại nhà' }];
    });

  const saveSchedule = async () => {
    if (edSessions.length === 0 || edSessions.some(s => !s.day)) {
      Alert.alert('Chọn ngày học', 'Mỗi buổi cần chọn 1 ngày trong tuần.');
      return;
    }
    const first = edSessions[0];
    setSavingSched(true);
    try {
      await updateClass(classId, {
        schedule: {
          sessions: edSessions,
          day: first.day,
          days: [...new Set(edSessions.map(s => s.day))],
          start_time: first.start_time,
          duration: first.duration,
          location: first.location,
        },
      });
      setShowSched(false);
    } catch {
      Alert.alert('Chưa lưu được', 'Kiểm tra mạng và thử lại.');
    } finally {
      setSavingSched(false);
    }
  };

  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    setLoadingStus(true);
    Promise.resolve(fetchStudents(classId)).finally(() => { if (alive) setLoadingStus(false); });
    return () => { alive = false; };
  }, [classId, isDemo]);

  useEffect(() => {
    if (klass) {
      setDefaultFee(klass.default_fee);
      setFeeInput(String(Math.round(klass.default_fee / 1000)));
      setFeeMode((klass.fee_type as FeeMode) ?? 'month');
    }
  }, [klass?.id]);

  // Sync student list when real students load from API
  useEffect(() => {
    if (classStudents.length > 0) {
      setStus(classStudents.map(stu => {
        const fs = (stu as any).fee_setting as { fee_type: string; amount: number | null; note: string | null } | null;
        const override = !fs || fs.fee_type === 'default' ? null
          : fs.fee_type === 'free' ? 0
          : fs.amount ?? null;
        return {
          id: stu.id,
          name: stu.name,
          baseAmt: klass?.default_fee ?? 500000,
          override,
          overrideNote: fs?.note ?? null,
        };
      }));
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
      const feeType = newOverride === null ? 'default'
        : newOverride === 0 ? 'free'
        : newOverride < defaultFee ? 'discount'
        : 'custom';
      await setStudentFee(editingStu.id, {
        fee_type: feeType,
        amount: newOverride !== null ? newOverride : undefined,
        note: note || undefined,
      }).catch(() => {});
    }
    setEditingStu(null);
  };

  const handleSaveZaloLink = async (link: string) => {
    try {
      await updateClass(classId, { zalo_group_id: link || null });
    } catch {
      Alert.alert('Chưa lưu được', 'Kiểm tra mạng và thử lại.');
    }
    setShowZaloLink(false);
  };

  const handleSave = async () => {
    if (isDemo) return;
    try {
      await updateClass(classId, {
        name: className,
        subject,
        default_fee: defaultFee,
        fee_type: feeMode,
        color,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu thay đổi. Kiểm tra kết nối mạng.');
    }
  };

  const { archiveClass } = useClassesStore();
  const handleArchive = () => {
    if (isDemo) { Alert.alert('Bản demo', 'Đăng nhập tài khoản thật để lưu trữ lớp.'); return; }
    Alert.alert(
      'Lưu trữ lớp',
      `Lớp "${className}" sẽ được cất vào "Lớp đã lưu trữ" — không hiện ở danh sách chính nữa, nhưng dữ liệu vẫn còn và có thể khôi phục.`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Lưu trữ', style: 'destructive',
          onPress: async () => {
            try {
              await archiveClass(classId);
              navigation.navigate('MainTabs', { screen: 'Classes' });
            } catch {
              Alert.alert('Lỗi', 'Không lưu trữ được. Kiểm tra mạng và thử lại.');
            }
          },
        },
      ],
    );
  };

  if (loadingStus) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.green500} size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 16, 48) }}>

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
          <View style={[s.row, { alignItems: 'flex-start' }]}>
            <Text style={[s.rowLabel, { flex: 0, marginTop: 6 }]}>Màu sắc</Text>
            <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
              {CLASS_COLOR_KEYS.map(k => (
                <TouchableOpacity
                  key={k}
                  onPress={() => !isDemo && setColor(k)}
                  disabled={isDemo}
                  style={[s.colorDot, { backgroundColor: CLASS_COLORS[k].dot, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color === k ? colors.textPrimary : 'transparent' }]}
                  activeOpacity={0.8}
                >
                  {color === k && <IconCheck size={16} color="white" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── LỊCH HỌC ĐỊNH KỲ ── */}
        <SectionHeader>LỊCH HỌC ĐỊNH KỲ</SectionHeader>
        <View style={s.card}>
          <TouchableOpacity
            style={s.scheduleRow}
            onPress={isDemo ? undefined : openSchedEdit}
            disabled={isDemo}
            activeOpacity={0.7}
          >
            <View style={s.scheduleDot} />
            <View style={{ flex: 1 }}>
              {scheduleLines.length ? (
                scheduleLines.map((line, i) => (
                  <Text key={i} style={[s.scheduleDay, i > 0 && { marginTop: 3 }]}>{line}</Text>
                ))
              ) : (
                <>
                  <Text style={s.scheduleDay}>Chưa đặt lịch</Text>
                  <Text style={s.scheduleSub}>Thêm ngày, giờ, địa điểm</Text>
                </>
              )}
            </View>
            {!isDemo && <Text style={{ fontSize: 13, fontWeight: '700', color: colors.green700 }}>Sửa</Text>}
          </TouchableOpacity>
        </View>

        {/* ── HỌC PHÍ MẶC ĐỊNH ── */}
        <SectionHeader>HỌC PHÍ MẶC ĐỊNH</SectionHeader>
        <View style={s.card}>
          {/* Amount input */}
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={s.rowLabel}>Số tiền</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TextInput
                style={s.feeAmtInput}
                value={feeInput}
                onChangeText={v => {
                  setFeeInput(v);
                  const n = parseInt(v, 10) * 1000;
                  if (!isNaN(n) && n >= 0) setDefaultFee(n);
                }}
                keyboardType="numeric"
                placeholder="500"
                placeholderTextColor={colors.textMuted}
                editable={!isDemo}
              />
              <Text style={s.feeMeta}>nghìn đ</Text>
            </View>
          </View>
          {/* Presets */}
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 }]}>
            {[200, 300, 400, 500, 600, 800, 1000].map(k => (
              <TouchableOpacity
                key={k}
                style={[s.modeChip, defaultFee === k * 1000 && s.modeChipActive]}
                onPress={() => { setDefaultFee(k * 1000); setFeeInput(String(k)); }}
                disabled={isDemo}
              >
                <Text style={[s.modeChipText, defaultFee === k * 1000 && s.modeChipTextActive]}>
                  {k >= 1000 ? '1tr' : `${k}k`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Fee mode */}
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
          <Text style={{ fontSize: 12.5, color: colors.textSecondary, lineHeight: 18, paddingHorizontal: 16, paddingBottom: 12 }}>
            {FEE_TYPES.find(t => t.id === normFeeType(feeMode))?.hint}
          </Text>
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
          {stus.length > 0 ? (
            stus.map((stu, i) => (
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
            ))
          ) : (
            <View style={{ padding: 18, alignItems: 'center' }}>
              <Text style={s.emptyTitle}>Chưa có học sinh</Text>
              <Text style={s.emptySub}>Thêm học sinh vào lớp để đặt học phí riêng cho từng em.</Text>
            </View>
          )}
        </View>

        {/* ── NHÓM ZALO ── */}
        <SectionHeader>NHÓM ZALO</SectionHeader>
        <View style={s.card}>
          {klass?.zalo_group_id ? (
            <TouchableOpacity style={s.zaloRow} onPress={() => setShowZaloLink(true)}>
              <View style={s.zaloIcon}>
                <IconZalo size={20} color={colors.zalo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.zaloName}>Nhóm Zalo {klass.name}</Text>
                <Text style={s.zaloBadgeText}>Đã lưu link · chạm để mở hoặc đổi</Text>
              </View>
              <IconChevron size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.zaloRow} onPress={() => setShowZaloLink(true)}>
              <View style={[s.zaloIcon, { backgroundColor: colors.surfaceAlt }]}>
                <IconZalo size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.zaloName}>Lưu link nhóm Zalo</Text>
                <Text style={s.zaloBadgeText}>Dán link nhóm phụ huynh để mở nhanh</Text>
              </View>
              <IconChevron size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── LƯU THAY ĐỔI ── */}
        <Button
          label={saved ? 'Đã lưu' : 'Lưu thay đổi'}
          icon={saved ? <IconCheck size={18} color="white" /> : undefined}
          onPress={handleSave}
          disabled={isDemo}
          style={{ marginHorizontal: 16, marginTop: 20 }}
        />

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
          unit={FEE_UNIT[normFeeType(feeMode)]}
          onSave={handleStuFee}
          onClose={() => setEditingStu(null)}
        />
      )}

      {/* Zalo group link modal */}
      {showZaloLink && (
        <ZaloLinkModal
          current={klass?.zalo_group_id || ''}
          onSave={handleSaveZaloLink}
          onClose={() => setShowZaloLink(false)}
        />
      )}

      {/* Schedule edit modal */}
      {showSched && (
        <View style={s.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSched(false)} />
          <View style={[s.sheet, { maxHeight: '88%', paddingBottom: insets.bottom + 16 }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Lịch học định kỳ</Text>
            <Text style={s.sheetSub}>Mỗi buổi có giờ, thời lượng và địa điểm riêng. Kéo để xem hết.</Text>

            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator>
              {edSessions.map((sess, idx) => (
                <View key={idx} style={sc.sessionCard}>
                  <View style={sc.sessionHead}>
                    <Text style={sc.sessionTitle}>Buổi {idx + 1}</Text>
                    {edSessions.length > 1 && (
                      <TouchableOpacity onPress={() => removeSession(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={sc.removeText}>Xoá buổi</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={sc.label}>Ngày</Text>
                  <View style={sc.chipWrap}>
                    {DAY_CHIPS.map(d => (
                      <TouchableOpacity key={d.v} style={[sc.chip, sess.day === d.v && sc.chipActive]} onPress={() => patchSession(idx, { day: d.v })}>
                        <Text style={[sc.chipText, sess.day === d.v && sc.chipTextActive]}>{d.l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={sc.label}>Giờ</Text>
                  <View style={sc.chipWrap}>
                    {TIME_PRESETS.map(t => (
                      <TouchableOpacity key={t} style={[sc.chip, sess.start_time === t && sc.chipActive]} onPress={() => patchSession(idx, { start_time: t })}>
                        <Text style={[sc.chipText, sess.start_time === t && sc.chipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={sc.label}>Thời lượng</Text>
                  <View style={sc.chipWrap}>
                    {DUR_PRESETS.map(d => (
                      <TouchableOpacity key={d.v} style={[sc.chip, sess.duration === d.v && sc.chipActive]} onPress={() => patchSession(idx, { duration: d.v })}>
                        <Text style={[sc.chipText, sess.duration === d.v && sc.chipTextActive]}>{d.l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={sc.label}>Địa điểm</Text>
                  <View style={[sc.chipWrap, { marginBottom: 0 }]}>
                    {PLACE_PRESETS.map(p => (
                      <TouchableOpacity key={p} style={[sc.chip, sess.location === p && sc.chipActive]} onPress={() => patchSession(idx, { location: p })}>
                        <Text style={[sc.chipText, sess.location === p && sc.chipTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <TouchableOpacity style={sc.addBtn} onPress={addSession}>
                <Text style={sc.addBtnText}>+ Thêm buổi định kỳ</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={[s.btnPrimary, { marginTop: 14 }, savingSched && { opacity: 0.6 }]} onPress={saveSchedule} disabled={savingSched}>
              {savingSched ? <ActivityIndicator color="white" /> : <Text style={s.btnPrimaryText}>Lưu lịch học</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const sc = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'white' },
  chipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.green700 },
  sessionCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginBottom: 12, backgroundColor: colors.surfaceAlt },
  sessionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sessionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  removeText: { fontSize: 13, fontWeight: '700', color: colors.coral700 },
  addBtn: { paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: colors.green500, borderStyle: 'dashed', alignItems: 'center', backgroundColor: colors.green50, marginBottom: 4 },
  addBtnText: { fontSize: 14, fontWeight: '700', color: colors.green700 },
});

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
  feeAmtInput: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, minWidth: 56, textAlign: 'right' },
  feeMeta: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  modeChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white' },
  modeChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  modeChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  modeChipTextActive: { color: colors.green700 },

  customBadge: { backgroundColor: colors.coral100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  customBadgeText: { fontSize: 12, fontWeight: '700', color: colors.coral700 },
  soonBadge: { backgroundColor: colors.honey100, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  soonBadgeText: { fontSize: 12, fontWeight: '700', color: colors.honey700 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  stuFeeHint: { fontSize: 12, color: colors.textSecondary, marginHorizontal: 16, marginBottom: 8 },
  stuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  stuName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  feeTag: { fontSize: 14, fontWeight: '600' },
  feeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, marginTop: 2 },
  feeBadgeText: { fontSize: 12, fontWeight: '700' },
  feeNote: { fontSize: 12, color: colors.textSecondary, marginTop: 1, maxWidth: 100 },

  zaloRow: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, gap: 12 },
  zaloIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e8f2fb', alignItems: 'center', justifyContent: 'center' },
  zaloName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  zaloBadgeText: { fontSize: 12, color: colors.textSecondary },

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
