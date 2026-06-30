import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { IconSend, IconCalendar, IconSparkle, IconX, IconPlus } from '../../components/icons';
import { useAuthStore, isDemoToken } from '../../store/auth';
import { confirmMakeup, getMakeupPoll } from '../../api/announcements';

type Step = 'compose' | 'live' | 'confirmed';

type Slot = { id: string; day: string; time: string };
type Voter = { id: string; name: string };

const DEMO_VOTES: { sid: string; voter: Voter }[] = [
  { sid: 's2', voter: { id: 'v1', name: 'Minh Anh' } },
  { sid: 's1', voter: { id: 'v2', name: 'Phúc' } },
  { sid: 's2', voter: { id: 'v3', name: 'Khôi' } },
  { sid: 's1', voter: { id: 'v4', name: 'Hà My' } },
  { sid: 's2', voter: { id: 'v5', name: 'Quỳnh Như' } },
  { sid: 's3', voter: { id: 'v6', name: 'Bảo Long' } },
];

export function MakeupPollScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const teacher = useAuthStore(st => st.teacher);
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const makeupId: string | undefined = route?.params?.makeupId;
  const className: string = route?.params?.className || 'Lớp học';
  const rawSessionDate: string | undefined = route?.params?.sessionDate;
  const sessionLabel = rawSessionDate ? rawSessionDate.split('-').reverse().join('/') : 'đã nghỉ';
  const titlePrefix = teacher?.gender === 'thay' ? 'Thầy' : 'Cô';
  const senderName = teacher?.name ? `${titlePrefix} ${teacher.name}` : titlePrefix;
  const [step, setStep] = useState<Step>('compose');
  const [slots, setSlots] = useState<Slot[]>([
    { id: 's1', day: 'Thứ 7 · 24/05', time: '18:30 – 20:00' },
    { id: 's2', day: 'Chủ nhật · 25/05', time: '09:00 – 10:30' },
    { id: 's3', day: 'Thứ 2 · 26/05', time: '18:30 – 20:00' },
  ]);
  const [votes, setVotes] = useState<Record<string, Voter[]>>({ s1: [], s2: [], s3: [] });
  const [picked, setPicked] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showZalo, setShowZalo] = useState(false);
  const expected = 7;

  // Honest "copy + Mở Zalo" message — the teacher pastes this into the group;
  // the app never auto-sends to Zalo.
  const pollMessage =
    `Anh/chị ơi, ${titlePrefix.toLowerCase()} đề xuất ${slots.length} khung giờ học bù bên dưới. ` +
    `Anh/chị nhắn giúp ${titlePrefix.toLowerCase()} khung nào con đi được nhé 🌿\n\n` +
    slots.map((slot, i) => `${i + 1}. ${slot.day} · ${slot.time}`).join('\n');

  // Simulate incoming votes — DEMO SESSIONS ONLY. Real accounts must never see
  // fabricated parent votes; their results come from real Zalo replies later.
  useEffect(() => {
    if (step !== 'live' || !isDemo) return;
    const timers = DEMO_VOTES.map((v, i) =>
      setTimeout(() => {
        setVotes(prev => ({ ...prev, [v.sid]: [...(prev[v.sid] || []), v.voter] }));
      }, 900 + i * 750)
    );
    return () => timers.forEach(clearTimeout);
  }, [step, isDemo]);

  // Real accounts: load any actual vote tallies once we reach the live step.
  // Often 0 — the model is parents reply in Zalo and the teacher picks the slot.
  useEffect(() => {
    if (isDemo || step !== 'live' || !makeupId) return;
    let alive = true;
    getMakeupPoll(makeupId)
      .then((data: any) => {
        if (!alive || !data) return;
        const opts: any[] = data.options || data.poll?.options || [];
        if (!Array.isArray(opts) || opts.length === 0) return;
        setVotes(prev => {
          const next: Record<string, Voter[]> = { ...prev };
          opts.forEach((opt, i) => {
            const slot = slots[i];
            if (!slot) return;
            const voters: Voter[] = (opt.voters || []).map((v: any, vi: number) => ({
              id: v.id ?? `${slot.id}-${vi}`,
              name: v.name ?? v.voter_name ?? 'Phụ huynh',
            }));
            next[slot.id] = voters;
          });
          return next;
        });
      })
      .catch(() => { /* no tallies yet is fine */ });
    return () => { alive = false; };
  }, [isDemo, step, makeupId]);

  // Confirm a slot for REAL accounts → POST /makeups/{id}/confirm.
  const handlePick = async (slotId: string, optionIndex: number) => {
    if (isDemo) {
      setPicked(slotId);
      setStep('confirmed');
      return;
    }
    if (!makeupId) {
      Alert.alert('Chưa chốt được', 'Thiếu thông tin buổi học bù. Hãy thử mở lại từ thông báo.');
      return;
    }
    setConfirming(true);
    try {
      await confirmMakeup(makeupId, optionIndex);
      setPicked(slotId);
      setStep('confirmed');
    } catch {
      Alert.alert('Chưa chốt được', 'Không chốt được slot. Kiểm tra mạng và thử lại nhé.');
    } finally {
      setConfirming(false);
    }
  };

  if (step === 'confirmed') {
    const slot = slots.find(s => s.id === picked);
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <View style={s.successCircle}>
          <IconCalendar size={40} color={colors.green600} />
        </View>
        <Text style={s.successTitle}>Đã chốt buổi học bù</Text>
        <Text style={[s.successSub, { color: colors.green700, fontWeight: '600' }]}>
          {slot?.day} · {slot?.time}
        </Text>
        <Text style={[s.successSub, { fontWeight: '400', marginTop: 4 }]}>
          Đã thêm vào lịch tuần. Nhớ gửi tin chốt lịch dưới đây vào nhóm Zalo nhé.
        </Text>

        <View style={s.confirmCard}>
          <Text style={[s.sectionLabel, { marginBottom: 8 }]}>TIN CHỐT LỊCH · gửi vào nhóm Zalo</Text>
          <View style={s.zaloPreviewBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Text style={{ fontSize: 11, color: '#6b7d99', fontWeight: '600' }}>NHÓM ZALO · LỚP HỌC</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Avatar name={senderName} size={26} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 3 }}>{senderName}</Text>
                <View style={s.groupBubble}>
                  <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textPrimary }}>
                    {titlePrefix} chốt lịch: buổi học bù sẽ là{' '}
                    <Text style={{ fontWeight: '700' }}>{slot?.day}, {slot?.time}</Text> nhé. Cảm ơn anh/chị đã chọn slot 🌿
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.goBack()}>
          <Text style={s.ghostBtnText}>Về trang chính</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'live') {
    const total = Object.values(votes).reduce((a, v) => a + v.length, 0);
    const bestSlot = [...slots].sort((a, b) => (votes[b.id]?.length || 0) - (votes[a.id]?.length || 0))[0];
    return (
      <View style={s.container}>
        {/* Honey hero */}
        <View style={s.hero}>
          <View style={s.heroBadgeRow}>
            <View style={s.liveDot} />
            <Text style={s.heroEyebrow}>
              {isDemo ? 'ĐANG NHẬN PHẢN HỒI' : 'ĐỀ XUẤT LỊCH HỌC BÙ'}
            </Text>
          </View>
          <Text style={s.heroTitle}>Poll học bù · {className}</Text>
          <Text style={s.heroLine}>
            {total} phụ huynh đã trả lời / {expected} · bù cho buổi {sessionLabel}
          </Text>
        </View>

        {/* Honest waiting note — real accounts have no live vote feed yet */}
        {!isDemo && total === 0 && (
          <View style={s.waitingNote}>
            <Text style={s.waitingNoteText}>
              {titlePrefix} đã đề xuất các khung giờ — phụ huynh sẽ trả lời trong nhóm Zalo. Khi đã rõ buổi nào đông nhất, {titlePrefix.toLowerCase()} chọn slot đó rồi bấm chốt là xong nhé.
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom }}>
          <Text style={[s.sectionLabel, { marginTop: 4 }]}>CÁC SLOT ĐỀ XUẤT</Text>
          {slots.map((slot, slotIndex) => {
            const list = votes[slot.id] || [];
            const isBest = bestSlot?.id === slot.id && list.length > 0;
            const pct = expected > 0 ? list.length / expected : 0;
            return (
              <View key={slot.id} style={[s.slotCard, isBest && s.slotCardBest]}>
                {isBest && (
                  <View style={s.bestBadge}>
                    <Text style={s.bestBadgeText}>NHIỀU NHẤT</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{slot.day}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{slot.time}</Text>
                  </View>
                  <Text style={[s.voteCount, isBest && { color: '#8a6d30' }]}>
                    {list.length}
                    <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
                      /{expected}
                    </Text>
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, {
                    width: `${pct * 100}%` as any,
                    backgroundColor: isBest ? colors.honey500 : '#ccc',
                  }]} />
                </View>

                {/* Voter chips */}
                {list.length > 0 ? (
                  <View style={s.voterRow}>
                    {list.map((v) => (
                      <View key={v.id} style={s.voterChip}>
                        <Avatar name={v.name} size={20} />
                        <Text style={s.voterName}>{v.name.split(' ').slice(-1)[0]}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>
                    Chưa có ai chọn slot này
                  </Text>
                )}

                <TouchableOpacity
                  style={[s.chonBtn, isBest && s.chonBtnBest, confirming && { opacity: 0.6 }]}
                  disabled={confirming}
                  onPress={() => handlePick(slot.id, slotIndex)}
                >
                  <Text style={[s.chonBtnText, isBest && { color: 'white' }]}>
                    {confirming ? 'Đang chốt…' : 'Chốt slot này'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // Compose step
  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 + insets.bottom }}>
        {/* Hint */}
        <View style={s.hintBox}>
          <IconSparkle size={18} color={colors.green600} />
          <Text style={{ fontSize: 12, color: '#1a3d2a', lineHeight: 20, flex: 1, marginLeft: 10 }}>
            Đề xuất 2-3 khung giờ → {titlePrefix.toLowerCase()} gửi vào nhóm Zalo, phụ huynh trả lời khung con đi được. {titlePrefix} chọn slot phù hợp rồi chốt.
          </Text>
        </View>

        <Text style={s.sectionLabel}>CÁC KHUNG GIỜ ĐỀ XUẤT</Text>

        {slots.map((slot, i) => (
          <View key={slot.id} style={s.slotRow}>
            <View style={s.slotNum}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.green700 }}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{slot.day}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{slot.time}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSlots(slots.filter(x => x.id !== slot.id))}
              disabled={slots.length <= 2}
              style={{ padding: 6, opacity: slots.length <= 2 ? 0.3 : 1 }}
            >
              <IconX size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}

        {slots.length < 4 && (
          <TouchableOpacity
            style={s.addSlotBtn}
            onPress={() => {
              const next = new Date();
              next.setDate(next.getDate() + slots.length + 1);
              const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
              const dayLabel = `${dayNames[next.getDay()]} · ${next.getDate()}/${next.getMonth() + 1}`;
              const newId = `slot-${Date.now()}`;
              setSlots(prev => [...prev, { id: newId, day: dayLabel, time: '19:00 – 20:30' }]);
              setVotes(v => ({ ...v, [newId]: [] }));
            }}
          >
            <IconPlus size={16} color={colors.textSecondary} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Thêm khung giờ</Text>
          </TouchableOpacity>
        )}

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>XEM TRƯỚC POLL</Text>
        <View style={s.zaloPreviewBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Text style={{ fontSize: 11, color: '#6b7d99', fontWeight: '600' }}>NHÓM ZALO · LỚP HỌC</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Avatar name={senderName} size={28} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 3 }}>{senderName}</Text>
              <View style={s.groupBubble}>
                <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textPrimary, marginBottom: 10 }}>
                  Anh/chị ơi, {titlePrefix.toLowerCase()} đề xuất {slots.length} khung giờ học bù. Anh/chị tick slot con đi được nhé 🌿
                </Text>
                {slots.map((slot, i) => (
                  <View key={slot.id} style={s.pollOption}>
                    <View style={s.pollCheckbox} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary }}>
                      {slot.day} · {slot.time}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 32) }]}>
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => { if (isDemo) setStep('live'); else setShowZalo(true); }}
        >
          <IconSend size={20} color="white" />
          <Text style={s.btnPrimaryText}>
            {isDemo ? 'Gửi poll lên nhóm Zalo' : 'Soạn tin gửi nhóm Zalo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Real accounts: honest copy + Mở Zalo. After the teacher confirms she
          sent it, move to the live/waiting step to pick & chốt the slot. */}
      {showZalo && (
        <ZaloCopySheet
          title="Đề xuất lịch học bù"
          recipient="Nhóm Zalo · lớp học"
          message={pollMessage}
          hint="nhóm lớp"
          onConfirm={() => { setShowZalo(false); setStep('live'); }}
          onClose={() => setShowZalo(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hintBox: {
    backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green100,
    borderRadius: 16, padding: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12, color: colors.textSecondary, fontWeight: '700',
    letterSpacing: 0.4, marginBottom: 10,
  },
  slotRow: {
    backgroundColor: 'white', borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  slotNum: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.green100,
    alignItems: 'center', justifyContent: 'center',
  },
  addSlotBtn: {
    borderWidth: 1.5, borderColor: '#ccc', borderStyle: 'dashed',
    borderRadius: 16, padding: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  zaloPreviewBox: { backgroundColor: '#f0f3f9', borderRadius: 18, padding: 14, marginBottom: 12 },
  groupBubble: {
    backgroundColor: 'white', borderRadius: 4, borderTopRightRadius: 16,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16, padding: 12, paddingHorizontal: 14,
  },
  pollOption: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 8, paddingHorizontal: 10, backgroundColor: colors.surfaceAlt, borderRadius: 10, marginBottom: 6,
  },
  pollCheckbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#bbb' },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 16,
  },
  btnPrimary: {
    height: 56, borderRadius: 16, backgroundColor: colors.green500,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // Live step — honey hero
  hero: {
    backgroundColor: colors.honey100,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#f0e3c4',
  },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  heroEyebrow: {
    fontSize: 12, fontWeight: '700', color: '#8a6d30', letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 20, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 4,
  },
  heroLine: { fontSize: 13, color: '#8a6d30', fontWeight: '600', lineHeight: 19 },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#8a6d30', marginRight: 8,
  },
  waitingNote: {
    backgroundColor: colors.honey100, borderRadius: 14,
    marginHorizontal: 16, marginBottom: 4, padding: 14,
  },
  waitingNoteText: { fontSize: 13, color: '#8a6d30', lineHeight: 20 },
  slotCard: {
    backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  slotCardBest: { borderColor: '#e6c878', backgroundColor: colors.honey100, shadowOpacity: 0.12, shadowColor: '#8a6d30' },
  bestBadge: {
    position: 'absolute', top: -10, right: 12,
    backgroundColor: '#8a6d30', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  bestBadgeText: { fontSize: 10, fontWeight: '700', color: 'white', letterSpacing: 0.3 },
  voteCount: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: '#e8e4da', marginBottom: 12, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  voterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  voterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surfaceAlt, borderRadius: 999, padding: 3, paddingRight: 9,
  },
  voterName: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
  chonBtn: {
    width: '100%', padding: 10, borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  chonBtnBest: { backgroundColor: '#8a6d30' },
  chonBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },

  // Confirmed
  successCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.green100,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  successTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4, color: colors.textPrimary },
  successSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  confirmCard: { width: '100%', marginTop: 24, marginBottom: 16 },
  ghostBtn: { padding: 12 },
  ghostBtnText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
});
