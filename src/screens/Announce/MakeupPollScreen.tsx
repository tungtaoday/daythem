import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { IconSend, IconCalendar, IconSparkle, IconX, IconPlus } from '../../components/icons';

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
  const [step, setStep] = useState<Step>('compose');
  const [slots, setSlots] = useState<Slot[]>([
    { id: 's1', day: 'Thứ 7 · 24/05', time: '18:30 – 20:00' },
    { id: 's2', day: 'Chủ nhật · 25/05', time: '09:00 – 10:30' },
    { id: 's3', day: 'Thứ 2 · 26/05', time: '18:30 – 20:00' },
  ]);
  const [votes, setVotes] = useState<Record<string, Voter[]>>({ s1: [], s2: [], s3: [] });
  const [picked, setPicked] = useState<string | null>(null);
  const expected = 7;

  // Simulate incoming votes when step = live
  useEffect(() => {
    if (step !== 'live') return;
    const timers = DEMO_VOTES.map((v, i) =>
      setTimeout(() => {
        setVotes(prev => ({ ...prev, [v.sid]: [...(prev[v.sid] || []), v.voter] }));
      }, 900 + i * 750)
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

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
          Đã thêm vào lịch tuần. Nhóm Zalo đã nhận thông báo.
        </Text>

        <View style={s.confirmCard}>
          <View style={s.zaloPreviewBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Text style={{ fontSize: 11, color: '#6b7d99', fontWeight: '600' }}>NHÓM ZALO · LỚP HỌC</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Avatar name="Cô Mai" size={26} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 3 }}>Cô Mai</Text>
                <View style={s.groupBubble}>
                  <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textPrimary }}>
                    Cô chốt lịch: buổi học bù sẽ là{' '}
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
        {/* Live banner */}
        <View style={s.liveBanner}>
          <View style={s.liveDot} />
          <Text style={{ fontSize: 13, color: colors.green700, flex: 1 }}>
            Đang nhận phản hồi từ nhóm Zalo
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            {total}/{expected} phụ huynh
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {slots.map((slot) => {
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
                  <Text style={[s.voteCount, isBest && { color: colors.green700 }]}>
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
                    backgroundColor: isBest ? colors.green500 : '#ccc',
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
                  style={[s.chonBtn, isBest && s.chonBtnBest]}
                  onPress={() => { setPicked(slot.id); setStep('confirmed'); }}
                >
                  <Text style={[s.chonBtnText, isBest && { color: 'white' }]}>Chốt slot này</Text>
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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {/* Hint */}
        <View style={s.hintBox}>
          <IconSparkle size={18} color={colors.green600} />
          <Text style={{ fontSize: 12, color: '#1a3d2a', lineHeight: 20, flex: 1, marginLeft: 10 }}>
            Đề xuất 2-3 khung giờ → phụ huynh tick chọn slot rảnh. Cô chốt slot nhiều người nhất.
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
            onPress={() => setSlots([...slots, {
              id: 's' + (slots.length + 1),
              day: 'Thứ 3 · 27/05',
              time: '19:00 – 20:30',
            }])}
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
            <Avatar name="Cô Mai" size={28} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 3 }}>Cô Mai</Text>
              <View style={s.groupBubble}>
                <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textPrimary, marginBottom: 10 }}>
                  Anh/chị ơi, cô đề xuất {slots.length} khung giờ học bù. Anh/chị tick slot con đi được nhé 🌿
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

      <View style={s.bottomBar}>
        <TouchableOpacity style={s.btnPrimary} onPress={() => setStep('live')}>
          <IconSend size={20} color="white" />
          <Text style={s.btnPrimaryText}>Gửi poll lên nhóm Zalo</Text>
        </TouchableOpacity>
      </View>
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
    padding: 16, paddingBottom: 32,
  },
  btnPrimary: {
    height: 56, borderRadius: 16, backgroundColor: colors.green500,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // Live step
  liveBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green100,
    borderRadius: 16, margin: 16, padding: 12, paddingHorizontal: 14,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green500, marginRight: 12,
  },
  slotCard: {
    backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  slotCardBest: { borderColor: colors.green500, shadowOpacity: 0.12, shadowColor: colors.green500 },
  bestBadge: {
    position: 'absolute', top: -10, right: 12,
    backgroundColor: colors.green500, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
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
  chonBtnBest: { backgroundColor: colors.green500 },
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
