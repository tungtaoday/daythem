import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Animated,
} from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/auth';
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

// ── Tone presets (match design) ───────────────────────────────

const TONES: Record<string, any> = {
  class: {
    label: 'BUỔI HỌC HÔM NAY',
    heroBg: '#4a9e72',
    heroBgGrad: 'linear-gradient(160deg, #4a9e72, #2f6849)',
    iconBg: '#d8f3e3', iconColor: '#2f6849',
    btnBg: '#4a9e72', btnColor: 'white',
    Icon: IconClock,
  },
  risk: {
    label: 'CẦN QUAN TÂM',
    heroBg: '#e07a5f',
    heroBgGrad: 'linear-gradient(160deg, #e07a5f, #b85a42)',
    iconBg: '#ffe5da', iconColor: '#b85a42',
    btnBg: '#e07a5f', btnColor: 'white',
    Icon: IconWarn,
  },
  money: {
    label: 'HỌC PHÍ',
    heroBg: '#c8902a',
    heroBgGrad: 'linear-gradient(160deg, #d9a23b, #b07a20)',
    iconBg: '#fef5e1', iconColor: '#b07a20',
    btnBg: '#c8902a', btnColor: 'white',
    Icon: IconWallet,
  },
  report: {
    label: 'TUẦN NÀY',
    heroBg: '#5d8aa8',
    heroBgGrad: 'linear-gradient(160deg, #5d8aa8, #3d6a88)',
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
    ? [nc.card, nc.cardPrimary, { backgroundImage: tone.heroBgGrad, backgroundColor: tone.heroBg }]
    : [nc.card];

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity }}>
      <View style={cardStyle}>
        {/* decorative blobs on primary */}
        {isPrimary && (
          <>
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
        <Text style={es.sub}>Hôm nay cô làm tốt lắm.{'\n'}Tận hưởng buổi chiều nhé.</Text>
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

// ── Main HomeScreen (HomeD) ───────────────────────────────────

export function HomeScreen({ navigation }: any) {
  const { teacher } = useAuthStore();
  const { classes, isLoading, fetchClasses } = useClassesStore();

  const [cards, setCards] = useState<any[]>([]);
  const [totalCards, setTotalCards] = useState(0);

  useEffect(() => { fetchClasses(); }, []);

  // Generate nudge cards from real data
  useEffect(() => {
    if (isLoading) return;
    const now = new Date();
    const todayN = DAY_N[now.getDay()];
    const todayClass = classes.find(c => c.schedule?.day === todayN) || classes[0] || null;
    const firstName = teacher?.name?.trim().split(/\s+/).pop() || 'cô';

    const generated: any[] = [];

    if (todayClass) {
      generated.push({
        id: 'class-tonight',
        kind: 'class',
        title: `Tối nay ${todayClass.schedule?.start_time || ''} cô dạy ${todayClass.name} · ${todayClass.subject}`,
        body: `${todayClass.student_count} học sinh sẽ học ${todayClass.schedule?.location || 'tại nhà'}.`,
        primary: { label: 'Mở lớp', icon: 'open' },
        secondary: { label: 'Tôi đã sẵn sàng' },
        meta: 'Hôm nay',
        classId: todayClass.id,
        className: todayClass.name,
      });
    }

    if (classes.length > 0) {
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
    if (dayOfWeek >= 4 || dayOfWeek === 0) { // Thu, Fri, Sat, Sun
      generated.push({
        id: 'report-ready',
        kind: 'report',
        title: 'Báo cáo tuần đã sẵn sàng',
        body: `Cô có muốn gửi tổng kết tuần cho ${classes.reduce((t, c) => t + (c.student_count || 0), 0)} phụ huynh không?`,
        primary: { label: 'Xem & gửi', icon: 'send' },
        secondary: { label: 'Để chủ nhật' },
      });
    }

    setCards(generated);
    setTotalCards(generated.length);
  }, [classes, isLoading, teacher]);

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

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
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
          {cards.length === 0
            ? 'Tất cả việc trong ngày đã xong rồi 🌿'
            : `Có ${cards.length} việc cô nên xem hôm nay:`}
        </Text>

        {/* ── Card feed ── */}
        <View style={s.feed}>
          {cards.length > 0
            ? cards.map((card, i) => (
                <NudgeCard
                  key={card.id}
                  card={card}
                  isPrimary={i === 0}
                  onDone={() => handlePrimary(card)}
                  onLater={() => dismiss(card.id)}
                />
              ))
            : <EmptyState />}
        </View>

        {/* ── Progress counter ── */}
        {done > 0 && cards.length > 0 && (
          <View style={s.progress}>
            <Text style={s.progressText}>
              Đã xử lý {done}/{totalCards} việc. Còn {cards.length} thôi cô ơi 🌿
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

  // Progress
  progress: { marginTop: 18, backgroundColor: '#f0faf4', borderRadius: 16, padding: 14 },
  progressText: { fontSize: 13, color: '#2f6849', lineHeight: 20 },
});
