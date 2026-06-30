import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { PromoBanner } from '../../components/ui/PromoBanner';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { syncNotifications } from '../../notifications/engine';
import { useAuthStore, isDemoToken } from '../../store/auth';
import { useClassesStore } from '../../store/classes';
import {
  IconCalendar, IconWallet, IconCheck,
  IconChart, IconWarn, IconZalo, IconClock, IconSend,
  IconChevron,
} from '../../components/icons';

// ── Helpers ──────────────────────────────────────────────────

function greeting(hour: number, g: string) {
  if (hour < 11) return { text: 'Chào buổi sáng', sub: `${g} có vài việc nho nhỏ` };
  if (hour < 14) return { text: `Chào ${g} buổi trưa`, sub: `Tối nay ${g} có lớp` };
  if (hour < 17) return { text: 'Chào buổi chiều', sub: 'Sắp đến giờ vào lớp rồi' };
  if (hour < 21) return { text: 'Chào buổi tối', sub: 'Sau buổi học cần xử lý vài việc' };
  return { text: `${g} đi nghỉ sớm nhé`, sub: 'Còn vài việc cho ngày mai' };
}

function todayStr() {
  const d = new Date();
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

const DAY_N: Record<number, number> = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };

// Tên thứ trong tuần (1=T2 .. 7=CN) — để hiển thị buổi học gần nhất.
const DAY_LABELS: Record<number, string> = {
  1: 'Thứ Hai', 2: 'Thứ Ba', 3: 'Thứ Tư', 4: 'Thứ Năm',
  5: 'Thứ Sáu', 6: 'Thứ Bảy', 7: 'Chủ nhật',
};

// Tìm lớp có buổi học gần nhất sắp tới (tính theo schedule.day, vòng tuần).
function nearestClass(classes: any[]): { cls: any; dayLabel: string } | null {
  const todayN = DAY_N[new Date().getDay()];
  let best: any = null;
  let bestDist = 99;
  for (const c of classes) {
    const d = c.schedule?.day;
    if (!d) continue;
    let dist = ((d - todayN) % 7 + 7) % 7;
    if (dist === 0) dist = 7; // hôm nay đã xử lý riêng → coi như tuần sau
    if (dist < bestDist) { bestDist = dist; best = c; }
  }
  if (!best) return null;
  return { cls: best, dayLabel: DAY_LABELS[best.schedule.day] || '' };
}

// Đánh giá buổi học hôm nay so với giờ hiện tại.
function classTiming(startTime?: string, durationMin?: number): 'upcoming' | 'ongoing' | 'finished' | null {
  if (!startTime) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(startTime);
  if (!m) return null;
  const now = new Date();
  const start = new Date(now);
  start.setHours(Number(m[1]), Number(m[2]), 0, 0);
  const end = new Date(start.getTime() + (durationMin || 90) * 60000);
  if (now < start) return 'upcoming';
  if (now <= end) return 'ongoing';
  return 'finished';
}

function dayPartWord(startTime?: string): string {
  const h = startTime ? Number(startTime.split(':')[0]) : new Date().getHours();
  if (h < 12) return 'Sáng nay';
  if (h < 18) return 'Chiều nay';
  return 'Tối nay';
}

// ── Tone presets (match design) ───────────────────────────────

// Hero (primary) card dùng nền xanh đặc — native (iOS/Android) không render
// CSS `linear-gradient`, nên dùng solid backgroundColor để web và máy khớp nhau.
// Mỗi loại việc 1 màu hero riêng → nhiều việc thì Home hiện nhiều màu khác nhau.
const TONES: Record<string, any> = {
  class: {
    label: 'BUỔI HỌC HÔM NAY',
    grad: ['#55b083', '#2f6849'] as [string, string], heroBg: '#2f6849',
    iconBg: '#d8f3e3', iconColor: '#2f6849',
    btnBg: '#4a9e72', btnColor: 'white',
    Icon: IconClock,
  },
  risk: {
    label: 'CẦN QUAN TÂM',
    grad: ['#ec8b73', '#c2593f'] as [string, string], heroBg: '#c2593f',
    iconBg: '#ffe5da', iconColor: '#b85a42',
    btnBg: '#e07a5f', btnColor: 'white',
    Icon: IconWarn,
  },
  money: {
    label: 'HỌC PHÍ',
    grad: ['#e9b84d', '#c8902a'] as [string, string], heroBg: '#c8902a',
    iconBg: '#fef5e1', iconColor: '#b07a20',
    btnBg: '#c8902a', btnColor: 'white',
    Icon: IconWallet,
  },
  report: {
    label: 'TUẦN NÀY',
    grad: ['#5b9bd5', '#2f6aa0'] as [string, string], heroBg: '#2f6aa0',
    iconBg: '#e8f2fa', iconColor: '#3d6a88',
    btnBg: '#5d8aa8', btnColor: 'white',
    Icon: IconChart,
  },
};

// ── NudgeCard ─────────────────────────────────────────────────

function NudgeCard({ card, isPrimary, onDone, onLater }: any) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const tone = TONES[card.kind];

  const dismiss = (dir: 'right' | 'left', cb: () => void) => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: dir === 'right' ? 500 : -500, duration: 350, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(cb);
  };

  const PrimaryIcon = card.primary?.icon === 'zalo' ? IconZalo
    : card.primary?.icon === 'send' ? IconSend
    : card.primary?.icon === 'check' ? IconCheck
    : IconChevron;

  const cardStyle: any = isPrimary
    ? [nc.card, nc.cardPrimary, { backgroundColor: tone.heroBg, overflow: 'hidden' }]
    : [nc.card];

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity }}>
      <View style={cardStyle}>
        {/* gradient nền + decorative blobs on primary */}
        {isPrimary && (
          <>
            <LinearGradient colors={tone.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={nc.blob1} />
            <View style={nc.blob2} />
          </>
        )}

        {/* tag row */}
        <View style={nc.tagRow}>
          <View style={[nc.iconWrap, { backgroundColor: isPrimary ? 'rgba(255,255,255,0.18)' : tone.iconBg }]}>
            <tone.Icon size={18} color={isPrimary ? 'white' : tone.iconColor} />
          </View>
          <Text style={[nc.tag, { color: isPrimary ? 'rgba(255,255,255,0.9)' : tone.iconColor }]}>
            {tone.label}
          </Text>
          {card.meta && (
            <View style={[nc.metaBadge, { backgroundColor: isPrimary ? 'rgba(255,255,255,0.18)' : '#eeece6' }]}>
              <Text style={[nc.metaText, { color: isPrimary ? 'white' : '#444' }]}>{card.meta}</Text>
            </View>
          )}
        </View>

        {/* title */}
        <Text style={[nc.title, isPrimary ? nc.titleLight : null, { fontSize: isPrimary ? 19 : 16 }]}>
          {card.title}
        </Text>

        {/* body */}
        <Text style={[nc.body, isPrimary ? nc.bodyLight : null]}>
          {card.body}
        </Text>

        {/* avatar stack for multi-student cards */}
        {card.avatarNames && (
          <View style={nc.avatarRow}>
            {card.avatarNames.map((name: string, i: number) => (
              <View key={i} style={[nc.avatarRing, { marginLeft: i === 0 ? 0 : -8, borderColor: isPrimary ? tone.heroBg : 'white' }]}>
                <Avatar name={name} size={28} />
              </View>
            ))}
          </View>
        )}

        {/* single student card */}
        {card.studentName && (
          <View style={[nc.studentRow, { backgroundColor: isPrimary ? 'rgba(255,255,255,0.14)' : '#f5f3ed' }]}>
            <Avatar name={card.studentName} size={32} />
            <View style={{ marginLeft: 10 }}>
              <Text style={[nc.studentName, isPrimary && { color: 'white' }]}>{card.studentName}</Text>
              {card.studentSub && <Text style={[nc.studentSub, isPrimary && { color: 'rgba(255,255,255,0.7)' }]}>{card.studentSub}</Text>}
            </View>
          </View>
        )}

        {/* buttons */}
        <View style={nc.btnRow}>
          <TouchableOpacity
            style={[nc.btnPrimary, { backgroundColor: isPrimary ? 'white' : tone.btnBg }]}
            onPress={() => dismiss('right', onDone)}
            activeOpacity={0.85}
          >
            <PrimaryIcon size={15} color={isPrimary ? tone.heroBg : 'white'} />
            <Text style={[nc.btnPrimaryText, { color: isPrimary ? tone.heroBg : 'white' }]}>
              {card.primary?.label}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[nc.btnSecondary, { backgroundColor: isPrimary ? 'rgba(255,255,255,0.14)' : 'transparent' }]}
            onPress={() => dismiss('left', onLater)}
            activeOpacity={0.7}
          >
            <Text style={[nc.btnSecondaryText, { color: isPrimary ? 'white' : '#888' }]}>
              {card.secondary?.label}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const nc = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#eeece6', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1, overflow: 'hidden', position: 'relative' },
  cardPrimary: { borderWidth: 0, shadowOpacity: 0.2, shadowRadius: 20, shadowColor: '#3d6849', elevation: 8, padding: 22 },
  blob1: { position: 'absolute', top: -40, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.08)' },
  blob2: { position: 'absolute', bottom: -50, right: -50, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.06)' },

  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tag: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  metaBadge: { marginLeft: 'auto' as any, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  metaText: { fontSize: 11, fontWeight: '600' },

  title: { fontWeight: '700', letterSpacing: -0.3, lineHeight: 22, marginBottom: 6, color: '#1a1a1a' },
  titleLight: { color: 'white' },
  body: { fontSize: 13.5, color: '#888', lineHeight: 20, marginBottom: 16 },
  bodyLight: { color: 'rgba(255,255,255,0.88)' },

  avatarRow: { flexDirection: 'row', marginBottom: 16 },
  avatarRing: { borderWidth: 2, borderRadius: 16 },

  studentRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 10, marginBottom: 16 },
  studentName: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  studentSub: { fontSize: 11, color: '#888', marginTop: 1 },

  btnRow: { flexDirection: 'row', gap: 8 },
  btnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14 },
  btnPrimaryText: { fontSize: 14, fontWeight: '700' },
  btnSecondary: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14 },
  btnSecondaryText: { fontSize: 13, fontWeight: '600' },
});

// ── Empty state ───────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={es.wrap}>
      <View style={es.inner}>
        <View style={es.icon}>
          <Text style={{ fontSize: 40 }}>🌿</Text>
        </View>
        <Text style={es.title}>Tất cả việc xong rồi!</Text>
        <Text style={es.sub}>Làm tốt lắm hôm nay!{'\n'}Tận hưởng buổi chiều nhé.</Text>
      </View>
    </View>
  );
}

const es = StyleSheet.create({
  wrap: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#f0faf4', borderWidth: 1, borderColor: '#aee6c5', padding: 32, alignItems: 'center' } as any,
  inner: { alignItems: 'center' },
  icon: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#4a9e72', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#4a9e72', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a3d2a', letterSpacing: -0.4, marginBottom: 8 },
  sub: { fontSize: 15, color: '#3d8760', textAlign: 'center', lineHeight: 22 },
});

// ── Warm "no class today" card ─────────────────────────────────
// Có lớp nhưng hôm nay không có buổi nào → card ấm áp, gợi nghỉ/soạn bài.

function WarmRestCard({ genderStr, classes }: { genderStr: string; classes: any[] }) {
  const near = nearestClass(classes);
  return (
    <View style={wr.card}>
      <View style={wr.blob1} />
      <View style={wr.blob2} />
      <View style={wr.iconWrap}>
        <Text style={wr.emoji}>🌿</Text>
      </View>
      <Text style={wr.title}>Hôm nay {genderStr} không có lớp nào 🌿</Text>
      <Text style={wr.body}>
        {near
          ? `Buổi gần nhất là ${near.cls.name} vào ${near.dayLabel}. Tranh thủ nghỉ hoặc soạn bài nhé ${genderStr}.`
          : `Tranh thủ nghỉ ngơi hoặc soạn bài cho buổi tới nhé ${genderStr}.`}
      </Text>
    </View>
  );
}

const wr = StyleSheet.create({
  card: { borderRadius: 22, backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green200, padding: 26, overflow: 'hidden', position: 'relative' } as any,
  blob1: { position: 'absolute', top: -34, right: -24, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(74,158,114,0.10)' },
  blob2: { position: 'absolute', bottom: -44, left: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(242,201,76,0.14)' },
  iconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: colors.green500, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  emoji: { fontSize: 34 },
  title: { fontSize: 19, fontWeight: '700', color: colors.green900, letterSpacing: -0.3, lineHeight: 26, marginBottom: 8 },
  body: { fontSize: 14.5, color: colors.green600, lineHeight: 22 },
});

// ── Getting started (first-run) ───────────────────────────────

function GettingStarted({ hasClass, hasStudents, firstClass, navigation }: any) {
  const steps = [
    { done: hasClass, label: 'Tạo lớp học đầu tiên', sub: 'Đặt tên, lịch học, học phí mặc định' },
    { done: hasStudents, label: 'Thêm học sinh vào lớp', sub: 'Tên, phụ huynh, số Zalo' },
    { done: false, label: 'Điểm danh & thu học phí', sub: 'Dùng mỗi buổi, nhắc phụ huynh qua Zalo' },
  ];
  const cta = !hasClass
    ? { label: '+ Tạo lớp học đầu tiên', onPress: () => navigation.navigate('CreateClass') }
    : !hasStudents
      ? { label: '+ Thêm học sinh', onPress: () => navigation.navigate('ClassStudents', { classId: firstClass?.id, className: firstClass?.name }) }
      : null;

  return (
    <View style={gs.card}>
      <Text style={gs.emoji}>🌱</Text>
      <Text style={gs.title}>Bắt đầu với GieoChữ</Text>
      <Text style={gs.sub}>Vài bước nhỏ để sẵn sàng quản lý lớp dạy thêm:</Text>

      <View style={gs.steps}>
        {steps.map((st, i) => {
          const active = !st.done && steps.slice(0, i).every(s => s.done);
          return (
            <View key={i} style={gs.step}>
              <View style={[gs.bullet, st.done && gs.bulletDone, active && gs.bulletActive]}>
                {st.done
                  ? <IconCheck size={14} color="white" />
                  : <Text style={[gs.bulletNum, active && { color: 'white' }]}>{i + 1}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[gs.stepLabel, st.done && gs.stepLabelDone]}>{st.label}</Text>
                <Text style={gs.stepSub}>{st.sub}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {cta && (
        <TouchableOpacity style={gs.cta} onPress={cta.onPress} activeOpacity={0.85}>
          <Text style={gs.ctaText}>{cta.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const gs = StyleSheet.create({
  card: { borderRadius: 22, backgroundColor: 'white', borderWidth: 1, borderColor: '#eeece6', padding: 22 },
  emoji: { fontSize: 36, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.3, marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', lineHeight: 20, marginBottom: 18 },
  steps: { gap: 14, marginBottom: 20 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bullet: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0eee8', alignItems: 'center', justifyContent: 'center' },
  bulletActive: { backgroundColor: '#4a9e72' },
  bulletDone: { backgroundColor: '#4a9e72' },
  bulletNum: { fontSize: 14, fontWeight: '700', color: '#9e9e9e' },
  stepLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  stepLabelDone: { color: '#9e9e9e', textDecorationLine: 'line-through' },
  stepSub: { fontSize: 12.5, color: '#999', marginTop: 1 },
  cta: { backgroundColor: '#4a9e72', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  ctaText: { color: 'white', fontSize: 15, fontWeight: '700' },
});

// ── Main HomeScreen (HomeD) ───────────────────────────────────

export function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { teacher } = useAuthStore();
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const { classes, isLoading, fetchClasses } = useClassesStore();

  const [cards, setCards] = useState<any[]>([]);
  const [totalCards, setTotalCards] = useState(0);

  useEffect(() => { fetchClasses(); }, []);

  // Reschedule local notifications from server config whenever classes change (real accounts).
  useEffect(() => {
    if (isDemo || isLoading) return;
    const gw = teacher?.gender === 'thay' ? 'thầy' : 'cô';
    syncNotifications(classes as any, gw).catch(() => {});
  }, [classes, isLoading, isDemo]);

  // Generate nudge cards from real data
  useEffect(() => {
    if (isLoading) return;
    const now = new Date();
    const todayN = DAY_N[now.getDay()];
    // CHỈ lấy lớp có lịch đúng hôm nay (không fallback sang lớp khác).
    const todayClass = classes.find(c => c.schedule?.day === todayN) || null;
    const gw = teacher?.gender === 'thay' ? 'thầy' : 'cô';

    const generated: any[] = [];
    const totalStudents = classes.reduce((t, c) => t + (c.student_count || 0), 0);
    // Tài khoản thật: chỉ tạo thẻ học phí / báo cáo khi đã có học sinh thật.
    // Phiên demo: luôn hiện feed đầy đủ.
    const hasStudents = totalStudents > 0;

    if (todayClass) {
      const timing = isDemo ? 'upcoming' : classTiming(todayClass.schedule?.start_time, todayClass.schedule?.duration);
      const st = todayClass.schedule?.start_time || '';
      const loc = todayClass.schedule?.location || 'tại nhà';
      const cnt = todayClass.student_count || 0;
      // Buổi đã qua → KHÔNG hiện "sắp tới" nữa.
      if (timing && timing !== 'finished') {
        const isNow = timing === 'ongoing';
        generated.push({
          id: 'class-today',
          kind: 'class',
          title: isNow
            ? `Đang diễn ra: ${todayClass.name} · ${todayClass.subject}`
            : `${dayPartWord(st)} ${st} ${gw} dạy ${todayClass.name} · ${todayClass.subject}`,
          body: `${cnt} học sinh${cnt ? '' : ' (chưa có học sinh)'} · ${loc}.`,
          primary: { label: isNow ? 'Điểm danh' : 'Mở lớp', icon: 'open' },
          secondary: { label: isNow ? 'Để sau' : 'Tôi đã sẵn sàng' },
          meta: isNow ? 'Đang học' : 'Sắp tới',
          classId: todayClass.id,
          className: todayClass.name,
        });
      }
    }

    if (classes.length > 0 && (isDemo || hasStudents)) {
      generated.push({
        id: 'unpaid',
        kind: 'money',
        title: 'Kiểm tra học phí tháng này',
        body: 'Xem ai chưa nộp và gửi nhắc nhẹ nhàng qua Zalo — đã có mẫu tin sẵn rồi.',
        primary: { label: 'Xem học phí', icon: 'send' },
        secondary: { label: 'Để sau' },
      });
    }

    const dayOfWeek = now.getDay();
    if ((dayOfWeek >= 4 || dayOfWeek === 0) && (isDemo || hasStudents)) { // Thu, Fri, Sat, Sun
      generated.push({
        id: 'report-ready',
        kind: 'report',
        title: 'Báo cáo tuần đã sẵn sàng',
        body: `${gw.charAt(0).toUpperCase() + gw.slice(1)} có muốn gửi tổng kết tuần cho ${totalStudents} phụ huynh không?`,
        primary: { label: 'Xem & gửi', icon: 'send' },
        secondary: { label: 'Để chủ nhật' },
      });
    }

    setCards(generated);
    setTotalCards(generated.length);
  }, [classes, isLoading, teacher, isDemo]);

  const dismiss = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handlePrimary = (card: any) => {
    dismiss(card.id);
    if (card.kind === 'class' && card.classId) {
      navigation.navigate('ClassDetail', { classId: card.classId, className: card.className });
    } else if (card.kind === 'money') {
      navigation.navigate('Tuition');
    } else if (card.kind === 'report') {
      navigation.navigate('Reports');
    }
  };

  const now = new Date();
  const genderStr = teacher?.gender === 'thay' ? 'thầy' : 'cô';
  const greet = greeting(now.getHours(), genderStr);
  const firstName = teacher?.name?.trim().split(/\s+/).pop() || genderStr;
  const done = totalCards - cards.length;

  // First-run guidance: chưa có lớp / chưa có học sinh → hiện hướng dẫn thay vì feed.
  const hasClass = classes.length > 0;
  const hasStudents = classes.reduce((t, c) => t + (c.student_count || 0), 0) > 0;
  const initialLoading = !isDemo && isLoading && classes.length === 0;
  const needsSetup = !isDemo && !isLoading && (!hasClass || !hasStudents);

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchClasses} tintColor="#4a9e72" />}
      >
        {/* ── Greeting ── */}
        <View style={s.greetRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            <Avatar name={teacher?.name || 'G'} size={42} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.greetDate}>{todayStr()} · {now.getHours()}:{String(now.getMinutes()).padStart(2, '0')}</Text>
          </View>
          <TouchableOpacity style={s.calBtn} onPress={() => navigation.navigate('Calendar')}>
            <IconCalendar size={18} color="#444" />
          </TouchableOpacity>
        </View>

        <Text style={s.greetTitle}>{greet.text}, {genderStr} {firstName}.</Text>
        <Text style={s.greetSub}>
          {initialLoading
            ? 'Đang tải...'
            : needsSetup
              ? (!hasClass ? `Cùng thiết lập lớp đầu tiên nào!` : `Lớp đã tạo — giờ thêm học sinh nhé!`)
              : cards.length === 0
                ? 'Tất cả việc trong ngày đã xong rồi 🌿'
                : 'Cùng xử lý gọn vài việc hôm nay nhé 🌿'}
        </Text>

        {/* ── Owner promo banner (server-driven, dismissible) ── */}
        <PromoBanner />

        {/* ── Feed / Getting started ── */}
        <View style={s.feed}>
          {initialLoading
            ? <ActivityIndicator color="#4a9e72" size="large" style={{ marginTop: 40 }} />
            : needsSetup
              ? <GettingStarted hasClass={hasClass} hasStudents={hasStudents} firstClass={classes[0]} navigation={navigation} />
              : cards.length > 0
                ? (
                    <>
                      <Text style={s.feedHeader}>CÓ {cards.length} VIỆC {genderStr === 'thầy' ? 'THẦY' : 'CÔ'} NÊN XEM</Text>
                      {cards.map((card, i) => (
                        <NudgeCard
                          key={card.id}
                          card={card}
                          isPrimary={i === 0}
                          onDone={() => handlePrimary(card)}
                          onLater={() => dismiss(card.id)}
                        />
                      ))}
                    </>
                  )
                : hasClass
                  ? <WarmRestCard genderStr={genderStr} classes={classes} />
                  : <EmptyState />}
        </View>

        {/* ── Progress counter ── */}
        {!needsSetup && done > 0 && cards.length > 0 && (
          <View style={s.progress}>
            <Text style={s.progressText}>
              Đã xử lý {done}/{totalCards} việc. Còn {cards.length} thôi {genderStr} ơi 🌿
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}


const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f2' },
  scroll: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },

  // Greeting
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  greetDate: { fontSize: 12, color: '#888', fontWeight: '600' },
  calBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'white', borderWidth: 1, borderColor: '#e8e4da', alignItems: 'center', justifyContent: 'center' },
  greetTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.5, lineHeight: 30, marginBottom: 4 },
  greetSub: { fontSize: 15, color: '#888', lineHeight: 22, marginBottom: 22 },

  // Feed
  feed: { gap: 12 },
  feedHeader: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: colors.textSecondary, marginBottom: 2 },

  // Progress
  progress: { marginTop: 18, backgroundColor: '#f0faf4', borderRadius: 16, padding: 14 },
  progressText: { fontSize: 13, color: '#2f6849', lineHeight: 20 },
});
