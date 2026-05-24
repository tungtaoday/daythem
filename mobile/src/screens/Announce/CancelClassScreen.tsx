import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { colors, radius } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { IconZalo, IconCheck, IconCalendar, IconBell, IconSend } from '../../components/icons';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { cancelClass, proposeMakeup } from '../../api/announcements';

const REASONS = ['Cô bận việc đột xuất', 'Sức khoẻ', 'Thời tiết xấu', 'Học sinh bận thi', 'Khác'];

function Toggle({ on }: { on: boolean }) {
  return (
    <View style={[tog.track, on && tog.trackOn]}>
      <View style={[tog.thumb, on && tog.thumbOn]} />
    </View>
  );
}
const tog = StyleSheet.create({
  track: { width: 44, height: 26, borderRadius: 13, padding: 2, backgroundColor: '#d0ccc5', flexShrink: 0 },
  trackOn: { backgroundColor: colors.green500 },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  thumbOn: { transform: [{ translateX: 18 }] },
});

function ZaloGroupPreview({ groupName, reason, note, makeup }: any) {
  const msg = `Cô gửi thông báo: Buổi học sẽ tạm nghỉ vì ${reason.toLowerCase()}.${note ? '\n' + note : ''}${makeup ? '\n\nCô sẽ đề xuất lịch học bù, anh/chị vui lòng theo dõi tin tiếp theo nhé 🌿' : '\n\nCảm ơn anh/chị!'}`;
  return (
    <View style={gp.box}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <IconZalo size={14} color="#3a7dd3" />
        <Text style={gp.groupLabel}>NHÓM ZALO · {groupName.toUpperCase()}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Avatar name="Cô Mai" size={28} />
        <View style={{ flex: 1 }}>
          <Text style={gp.senderName}>Cô Mai</Text>
          <View style={gp.bubble}>
            <Text style={{ fontSize: 13.5, lineHeight: 22, color: colors.textPrimary }}>{msg}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
const gp = StyleSheet.create({
  box: { backgroundColor: '#f0f3f9', borderRadius: 18, padding: 14, marginBottom: 12 },
  groupLabel: { fontSize: 11, color: '#6b7d99', fontWeight: '600' },
  senderName: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 3 },
  bubble: { backgroundColor: 'white', borderRadius: 4, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, padding: 10, paddingHorizontal: 14 },
});

export function CancelClassScreen({ route, navigation }: any) {
  const { classId, className } = route.params;
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');
  const [makeup, setMakeup] = useState(true);
  const [toGroup, setToGroup] = useState(true);
  const [toIndividual, setToIndividual] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [annId, setAnnId] = useState<string | null>(null);
  const [showZalo, setShowZalo] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const send = () => setShowZalo(true);

  const confirmSent = async () => {
    setShowZalo(false);
    setSending(true);
    try {
      const ann = await cancelClass(classId, {
        session_date: today,
        content: `Cô thông báo nghỉ vì ${reason.toLowerCase()}.${note ? ' ' + note : ''}`,
        propose_makeup: makeup,
      });
      setAnnId(ann.id);
    } catch {}
    setTimeout(() => { setSending(false); setSent(true); }, 400);
  };

  const handleMakeup = async () => {
    if (!annId) { navigation.navigate('MakeupPoll', { announcementId: null, makeupId: null }); return; }
    const d1 = new Date(); d1.setDate(d1.getDate() + 7);
    const d2 = new Date(); d2.setDate(d2.getDate() + ((6 - d2.getDay() + 7) % 7) + 1);
    try {
      const r = await proposeMakeup(annId, [
        { date: d1.toISOString().slice(0, 10), time: '19:00', label: `${d1.toLocaleDateString('vi-VN')} · 19:00` },
        { date: d2.toISOString().slice(0, 10), time: '09:00', label: `${d2.toLocaleDateString('vi-VN')} · 09:00` },
      ]);
      navigation.navigate('MakeupPoll', { announcementId: annId, makeupId: r?.id });
    } catch {
      navigation.navigate('MakeupPoll', { announcementId: annId, makeupId: null });
    }
  };

  if (sent) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <View style={s.successCircle}>
          <Text style={{ fontSize: 40, color: colors.green600 }}>✓</Text>
        </View>
        <Text style={s.successTitle}>Đã báo nghỉ</Text>
        <Text style={s.successSub}>
          {toGroup && toIndividual
            ? 'Đã đăng lên nhóm Zalo và gửi riêng từng phụ huynh.'
            : toGroup
            ? 'Đã đăng lên nhóm Zalo.'
            : toIndividual
            ? 'Đã gửi riêng từng phụ huynh.'
            : 'Thông báo đã được ghi nhận.'}
        </Text>
        {makeup && (
          <View style={s.nextStep}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.green700 }}>✦ Bước tiếp theo</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 20, marginBottom: 14 }}>
              Đề xuất buổi học bù để phụ huynh chọn slot phù hợp.
            </Text>
            <TouchableOpacity style={s.btnPrimary} onPress={handleMakeup}>
              <Text style={s.btnPrimaryText}>Đề xuất buổi học bù →</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.goBack()}>
          <Text style={s.ghostBtnText}>Về trang chính</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const groupName = `${className || 'Lớp học'} · Toán`;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: sending ? 24 : 110 }}>
        {/* Class chip */}
        <View style={s.classChip}>
          <View style={s.accentBar} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
              {className || 'Lớp học'} · {today.split('-').reverse().join('/')}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Buổi học sắp tới</Text>
          </View>
          <View style={s.nghiBadge}>
            <Text style={s.nghiBadgeText}>Sẽ nghỉ</Text>
          </View>
        </View>

        {/* Reasons */}
        <Text style={s.sectionLabel}>LÝ DO</Text>
        <View style={s.chipRow}>
          {REASONS.map(r => (
            <TouchableOpacity
              key={r}
              style={[s.reasonChip, reason === r && s.reasonChipActive]}
              onPress={() => setReason(r)}
            >
              <Text style={[s.reasonChipText, reason === r && s.reasonChipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <TextInput
          style={s.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Ghi chú thêm cho phụ huynh (tuỳ chọn)"
          placeholderTextColor={colors.textMuted}
          multiline
        />

        {/* Makeup toggle */}
        <TouchableOpacity
          style={[s.makeupCard, makeup && s.makeupCardActive]}
          onPress={() => setMakeup(!makeup)}
          activeOpacity={0.85}
        >
          <View style={[s.makeupIcon, makeup && { backgroundColor: colors.green500 }]}>
            <IconCalendar size={18} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Đặt buổi học bù</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Đề xuất lịch để phụ huynh chốt</Text>
          </View>
          <Toggle on={makeup} />
        </TouchableOpacity>

        {/* Channel selector */}
        <Text style={s.sectionLabel}>GỬI QUA</Text>
        <View style={s.channelCard}>
          <TouchableOpacity
            style={s.channelRow}
            onPress={() => setToGroup(!toGroup)}
            activeOpacity={0.8}
          >
            <View style={s.channelIconGreen}>
              <IconZalo size={18} color={colors.green700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Nhóm Zalo · {groupName}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>cô + phụ huynh</Text>
            </View>
            <Toggle on={toGroup} />
          </TouchableOpacity>

          <View style={s.divider} />

          <TouchableOpacity
            style={s.channelRow}
            onPress={() => setToIndividual(!toIndividual)}
            activeOpacity={0.8}
          >
            <View style={s.channelIconHoney}>
              <IconBell size={18} color="#8a6d30" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Nhắn riêng từng phụ huynh</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Phòng khi nhóm bị im tiếng</Text>
            </View>
            <Toggle on={toIndividual} />
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <Text style={s.sectionLabel}>XEM TRƯỚC TIN</Text>
        <ZaloGroupPreview groupName={groupName} reason={reason} note={note} makeup={makeup} />
      </ScrollView>

      {/* Bottom bar */}
      {!sending ? (
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.btnPrimary} onPress={send}>
            <IconZalo size={20} color="white" />
            <Text style={s.btnPrimaryText}>Soạn tin nhắn Zalo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.sendingBar}>
          <ActivityIndicator color={colors.green500} size="small" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginLeft: 12 }}>
            Đang lưu thông báo...
          </Text>
        </View>
      )}

      {showZalo && (
        <ZaloCopySheet
          title="Báo nghỉ · Thông báo phụ huynh"
          recipient={`Nhóm Zalo ${groupName}`}
          message={`Cô gửi thông báo: Buổi học ${today.split('-').reverse().join('/')} sẽ tạm nghỉ vì ${reason.toLowerCase()}.${note ? '\n' + note : ''}${makeup ? '\n\nCô sẽ đề xuất lịch học bù, anh/chị vui lòng theo dõi tin tiếp theo nhé 🌿' : '\n\nCảm ơn anh/chị!'}`}
          hint={groupName}
          onConfirm={confirmSent}
          onClose={() => setShowZalo(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  classChip: {
    backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  accentBar: { width: 4, height: 36, borderRadius: 2, backgroundColor: colors.coral500 },
  nghiBadge: { backgroundColor: '#ffeae3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  nghiBadgeText: { fontSize: 12, fontWeight: '600', color: colors.coral700 },
  sectionLabel: {
    fontSize: 12, color: colors.textSecondary, fontWeight: '700',
    letterSpacing: 0.4, marginBottom: 10, marginTop: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  reasonChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: 'white',
  },
  reasonChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  reasonChipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  reasonChipTextActive: { color: colors.green700 },
  noteInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 14,
    padding: 14, fontSize: 14, color: colors.textPrimary,
    backgroundColor: 'white', marginBottom: 16,
    minHeight: 52,
  },
  makeupCard: {
    backgroundColor: 'white', borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  makeupCardActive: { backgroundColor: colors.green50, borderColor: colors.green200 ?? '#aee6c5' },
  makeupIcon: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: '#ccc',
    alignItems: 'center', justifyContent: 'center',
  },
  channelCard: {
    backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 12, marginBottom: 16,
  },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  channelIconGreen: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: colors.green100,
    alignItems: 'center', justifyContent: 'center',
  },
  channelIconHoney: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: colors.honey100,
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 16, paddingBottom: 32,
  },
  sendingBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 20, paddingBottom: 36,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  btnPrimary: {
    height: 56, borderRadius: 16, backgroundColor: colors.green500,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '600' },
  successCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.green100,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  successTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
  successSub: { fontSize: 13, color: colors.textSecondary, maxWidth: 280, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  nextStep: {
    backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green100,
    borderRadius: 18, padding: 18, marginBottom: 14, width: '100%',
  },
  ghostBtn: { padding: 12 },
  ghostBtnText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
});
