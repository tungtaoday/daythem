import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { IconZalo } from '../../components/icons';
import { useClassesStore } from '../../store/classes';
import { generateReport } from '../../api/reports';

function weekLabel(d = new Date()) {
  const mon = new Date(d);
  const day2 = mon.getDay();
  mon.setDate(mon.getDate() - day2 + (day2 === 0 ? -6 : 1));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (dt: Date) => `${dt.getDate()}/${dt.getMonth() + 1}`;
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function getMondayOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10);
}

const DEMO_STU_REPORT = [
  { name: 'Nguyễn Minh Anh', attend: 100, paid: true },
  { name: 'Trần Bảo Long', attend: 75, paid: false },
  { name: 'Lê Hoàng Phúc', attend: 100, paid: true },
  { name: 'Phạm Quỳnh Như', attend: 88, paid: false },
  { name: 'Đỗ Minh Khôi', attend: 100, paid: true },
  { name: 'Vũ Hà My', attend: 88, paid: true },
  { name: 'Bùi Nam Sơn', attend: 63, paid: false },
];

function StatBox({ label, value, bg, color }: { label: string; value: string; bg: string; color: string }) {
  return (
    <View style={[s.statBox, { backgroundColor: bg }]}>
      <Text style={[s.statLabel, { color }]}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

export function ClassReportScreen({ route }: any) {
  const { classId, className } = route.params;
  const { classes, students } = useClassesStore();
  const [showZalo, setShowZalo] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const klass = classes.find(c => c.id === classId);
  const classStudents = students[classId] || [];
  const isDemo = classStudents.length === 0;

  const stuReport = isDemo
    ? DEMO_STU_REPORT
    : classStudents.map(s => ({ name: s.name, attend: 88, paid: false }));

  const totalCount = stuReport.length;
  const presentCount = stuReport.filter(s => s.attend === 100).length;
  const absentCount = totalCount - presentCount;
  const paidCount = stuReport.filter(s => s.paid).length;

  const handleSend = async () => {
    setShowZalo(false);
    setSending(true);
    await new Promise(r => setTimeout(r, Math.min(totalCount * 80, 1200)));
    generateReport(classId, getMondayOfWeek()).catch(() => {});
    setSending(false);
    setDone(true);
  };

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={s.successCircle}>
          <Text style={{ fontSize: 48, color: colors.green600 }}>✓</Text>
        </View>
        <Text style={s.successTitle}>Đã gửi {totalCount} báo cáo</Text>
        <Text style={s.successSub}>Phụ huynh lớp {className} sẽ nhận qua Zalo.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Week + stats */}
        <Text style={s.weekLabel}>{weekLabel()}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <StatBox label="CÓ MẶT" value={`${presentCount}/${totalCount}`} bg={colors.green100} color={colors.green700} />
          <StatBox label="VẮNG" value={String(absentCount)} bg={colors.coral100} color={colors.coral700} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <StatBox label="ĐÃ NỘP TIỀN" value={`${paidCount}/${totalCount}`} bg={colors.honey100} color="#8a6d30" />
          <StatBox label="BUỔI DẠY" value="1" bg={colors.surfaceAlt} color={colors.textPrimary} />
        </View>

        {/* Per-student summary */}
        <Text style={s.sectionLabel}>TÌNH HÌNH TỪNG HỌC SINH</Text>
        <View style={s.card}>
          {stuReport.map((stu, i) => (
            <View key={stu.name} style={[s.stuRow, i > 0 && s.divider]}>
              <Avatar name={stu.name} size={36} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.stuName}>{stu.name}</Text>
                <Text style={s.stuSub}>
                  {stu.attend === 100 ? 'Có mặt đầy đủ' : `Chuyên cần ${stu.attend}%`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[s.badge, { backgroundColor: stu.attend === 100 ? colors.green100 : colors.coral100 }]}>
                  <Text style={[s.badgeText, { color: stu.attend === 100 ? colors.green700 : colors.coral700 }]}>
                    {stu.attend === 100 ? 'Có mặt' : 'Vắng'}
                  </Text>
                </View>
                <View style={[s.badge, { backgroundColor: stu.paid ? colors.green50 : colors.coral50 }]}>
                  <Text style={[s.badgeText, { color: stu.paid ? colors.green600 : colors.coral700 }]}>
                    {stu.paid ? 'Đã nộp' : 'Chưa nộp'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Zalo message preview */}
        <Text style={s.sectionLabel}>TIN NHẮN GỬI PHỤ HUYNH</Text>
        <View style={s.previewBox}>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={s.zaloBubble}>
              <Text style={{ fontSize: 13, lineHeight: 20, color: 'white' }}>
                Báo cáo tuần {weekLabel()} của <Text style={{ fontWeight: '700' }}>[Tên con]</Text>:{'\n'}
                • Đi học: 1/1 buổi{'\n'}
                • Bài tập: làm đầy đủ{'\n'}
                • Học phí: đã thu{'\n'}
                <Text style={{ opacity: 0.85 }}>Mọi thắc mắc anh/chị nhắn lại cho cô nhé 🌿</Text>
              </Text>
            </View>
          </View>
          <Text style={s.previewNote}>Tên và số liệu điền tự động cho từng phụ huynh</Text>
        </View>
      </ScrollView>

      {/* Bottom send button */}
      {!sending && (
        <View style={[s.bottomBar, { backgroundImage: 'linear-gradient(to top, #faf8f2 60%, transparent)' } as any]}>
          <TouchableOpacity style={s.sendBtn} onPress={() => setShowZalo(true)}>
            <IconZalo size={20} color="white" />
            <Text style={s.sendBtnText}>Soạn báo cáo · {totalCount} phụ huynh</Text>
          </TouchableOpacity>
        </View>
      )}

      {showZalo && (
        <ZaloCopySheet
          title={`Báo cáo tuần · ${className}`}
          recipient={`${totalCount} phụ huynh · ${className}`}
          message={`Báo cáo tuần ${weekLabel()} của [Tên con]:\n• Đi học: 1/1 buổi\n• Bài tập: làm đầy đủ\n• Học phí: đã thu T${new Date().getMonth() + 1}\n\nMọi thắc mắc anh/chị nhắn lại cho cô nhé 🌿`}
          hint="từng phụ huynh trong lớp"
          onConfirm={handleSend}
          onClose={() => setShowZalo(false)}
        />
      )}
    </View>
  );
}


const s = StyleSheet.create({
  weekLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  statBox: { flex: 1, borderRadius: 16, padding: 14 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 10, marginTop: 16 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 4 },
  stuRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  stuName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  stuSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  previewBox: { backgroundColor: colors.surfaceAlt, borderRadius: 18, padding: 14 },
  zaloBubble: { backgroundColor: '#5b9bd5', borderRadius: 18, borderBottomRightRadius: 4, padding: 10, paddingHorizontal: 14, maxWidth: '90%' as any },
  previewNote: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 32 },
  sendBtn: { height: 56, borderRadius: 16, backgroundColor: colors.green500, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sendBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  successTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: colors.textPrimary, marginBottom: 6 },
  successSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
