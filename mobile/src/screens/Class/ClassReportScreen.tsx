import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { classColor } from '../../theme/classColors';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { SuccessScreen } from '../../components/ui/SuccessScreen';
import { IconZalo, IconStar, IconWarn, IconBook } from '../../components/icons';
import { useClassesStore } from '../../store/classes';
import { generateReport } from '../../api/reports';
import { useAuthStore, isDemoToken } from '../../store/auth';

const VND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

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

// Bài đã dạy — chỉ là dữ liệu mẫu cho tài khoản demo.
const DEMO_LESSONS = [
  { title: 'Phương trình bậc hai', detail: 'Chữa 5 bài tập · giao bài về nhà' },
  { title: 'Hệ thức Vi-ét', detail: 'Lý thuyết + ví dụ áp dụng' },
];

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.heroStat}>
      <Text style={s.heroStatValue} numberOfLines={1}>{value}</Text>
      <Text style={s.heroStatLabel}>{label}</Text>
    </View>
  );
}

export function ClassReportScreen({ route }: any) {
  const { classId, className } = route.params;
  const insets = useSafeAreaInsets();
  const { classes, students, fetchStudents } = useClassesStore();
  const token = useAuthStore(st => st.token);
  const teacher = useAuthStore(st => st.teacher);
  const isDemo = isDemoToken(token);
  const pronoun = teacher?.gender === 'thay' ? 'thầy' : 'cô';
  const [showZalo, setShowZalo] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(!isDemo);

  const klass = classes.find(c => c.id === classId);
  const classStudents = students[classId] || [];

  const stuReport = isDemo
    ? DEMO_STU_REPORT
    : classStudents.map(s => ({ name: s.name, attend: 0, paid: false }));

  const totalCount = stuReport.length;
  const presentCount = stuReport.filter(s => s.attend === 100).length;
  const absentCount = totalCount - presentCount;
  const paidCount = stuReport.filter(s => s.paid).length;

  // Tài khoản demo: số tiền minh hoạ (mỗi HS đã nộp = 500k). Tài khoản thật KHÔNG bịa số.
  const demoAmount = paidCount * 500000;
  const topStudent = isDemo ? DEMO_STU_REPORT.find(st => st.attend === 100 && st.paid) : undefined;
  const watchStudent = isDemo
    ? DEMO_STU_REPORT.reduce((lo, st) => (st.attend < lo.attend ? st : lo), DEMO_STU_REPORT[0])
    : undefined;

  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    setLoading(true);
    Promise.resolve(fetchStudents(classId)).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [classId, isDemo]);

  const reportMessage = `Báo cáo tuần ${weekLabel()} của [Tên con]:\n• Đi học: 1/1 buổi\n• Bài tập: làm đầy đủ\n• Học phí: đã thu T${new Date().getMonth() + 1}\n\nMọi thắc mắc anh/chị nhắn lại cho ${pronoun} nhé 🌿`;

  const handleSend = async () => {
    setShowZalo(false);
    setSending(true);
    await new Promise(r => setTimeout(r, Math.min(totalCount * 80, 1200)));
    if (isDemo) {
      setSending(false);
      setDone(true);
      return;
    }
    try {
      await generateReport(classId, getMondayOfWeek());
      setSending(false);
      setDone(true);
    } catch {
      setSending(false);
      Alert.alert('Chưa gửi được', 'Không tạo được báo cáo. Kiểm tra mạng và thử lại.');
    }
  };

  if (done) {
    return (
      <SuccessScreen
        title={`Đã gửi ${totalCount} báo cáo`}
        sub={`Phụ huynh lớp ${className} sẽ nhận qua Zalo.`}
      />
    );
  }

  if (loading) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.bg }, s.center]}>
        <ActivityIndicator color={colors.green500} size="large" />
      </View>
    );
  }

  if (!isDemo && stuReport.length === 0) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.bg }, s.center]}>
        <Text style={s.emptyTitle}>Chưa có học sinh</Text>
        <Text style={s.emptySub}>Thêm học sinh vào {className} để tạo báo cáo.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>

        {/* Green hero — tổng kết tuần */}
        <View style={s.hero}>
          <LinearGradient colors={classColor(klass?.color).grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Text style={s.heroEyebrow}>BÁO CÁO TUẦN · {weekLabel()}</Text>
          <Text style={s.heroTitle}>Tổng kết {className}</Text>
          <View style={s.heroStatsRow}>
            <HeroStat label="Buổi dạy" value={isDemo ? '1' : 'Chưa có'} />
            <View style={s.heroDivider} />
            <HeroStat label="Có mặt" value={isDemo ? `${presentCount}/${totalCount}` : 'Chưa có'} />
            <View style={s.heroDivider} />
            <HeroStat label="Đã thu" value={isDemo ? VND(demoAmount) : 'Chưa có'} />
          </View>
        </View>

        <View style={s.body}>

          {/* Nổi bật tuần này — demo only (tài khoản thật không bịa số liệu) */}
          {isDemo && topStudent && watchStudent && (
            <>
              <Text style={s.sectionLabel}>NỔI BẬT TUẦN NÀY</Text>
              <View style={s.highlightRow}>
                <View style={[s.highlightCard, { backgroundColor: colors.green50, borderColor: colors.green200 }]}>
                  <View style={[s.highlightIcon, { backgroundColor: colors.green100 }]}>
                    <IconStar size={16} color={colors.green700} />
                  </View>
                  <Text style={[s.highlightKicker, { color: colors.green700 }]}>TIẾN BỘ NHẤT</Text>
                  <Text style={s.highlightName} numberOfLines={1}>{topStudent.name}</Text>
                  <Text style={s.highlightSub}>Đi học đầy đủ, làm bài tốt</Text>
                </View>
                <View style={[s.highlightCard, { backgroundColor: colors.coral50, borderColor: colors.coral100 }]}>
                  <View style={[s.highlightIcon, { backgroundColor: colors.coral100 }]}>
                    <IconWarn size={16} color={colors.coral700} />
                  </View>
                  <Text style={[s.highlightKicker, { color: colors.coral700 }]}>CẦN LƯU Ý</Text>
                  <Text style={s.highlightName} numberOfLines={1}>{watchStudent.name}</Text>
                  <Text style={s.highlightSub}>Chuyên cần {watchStudent.attend}%, chưa nộp phí</Text>
                </View>
              </View>
            </>
          )}

          {/* Bài đã dạy — demo only */}
          {isDemo && (
            <>
              <Text style={s.sectionLabel}>BÀI ĐÃ DẠY</Text>
              <View style={s.card}>
                {DEMO_LESSONS.map((l, i) => (
                  <View key={l.title} style={[s.lessonRow, i > 0 && s.divider]}>
                    <View style={s.lessonIcon}><IconBook size={16} color={colors.green700} /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.stuName}>{l.title}</Text>
                      <Text style={s.stuSub}>{l.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Tài khoản thật chưa có số liệu — giữ hướng dẫn trung thực */}
          {!isDemo && (
            <View style={[s.card, { padding: 16, alignItems: 'center' }]}>
              <Text style={s.emptyTitle}>Chưa có số liệu tuần này</Text>
              <Text style={s.emptySub}>Điểm danh và ghi nhận học phí để {pronoun} tổng kết tự động.</Text>
            </View>
          )}

          {/* Tình hình từng học sinh */}
          <Text style={s.sectionLabel}>TÌNH HÌNH TỪNG HỌC SINH</Text>
          <View style={s.card}>
            {stuReport.map((stu, i) => (
              <View key={stu.name} style={[s.stuRow, i > 0 && s.divider]}>
                <Avatar name={stu.name} size={36} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.stuName}>{stu.name}</Text>
                  <Text style={s.stuSub}>
                    {isDemo
                      ? (stu.attend === 100 ? 'Có mặt đầy đủ' : `Chuyên cần ${stu.attend}%`)
                      : 'Chưa có dữ liệu'}
                  </Text>
                </View>
                {isDemo && (
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
                )}
              </View>
            ))}
          </View>

          {/* Tin gửi phụ huynh — preview */}
          <Text style={s.sectionLabel}>TIN GỬI PHỤ HUYNH</Text>
          <View style={s.previewBox}>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={s.zaloBubble}>
                <Text style={{ fontSize: 13, lineHeight: 20, color: 'white' }}>
                  Báo cáo tuần {weekLabel()} của <Text style={{ fontWeight: '700' }}>[Tên con]</Text>:{'\n'}
                  • Đi học: 1/1 buổi{'\n'}
                  • Bài tập: làm đầy đủ{'\n'}
                  • Học phí: đã thu{'\n'}
                  <Text style={{ opacity: 0.85 }}>Mọi thắc mắc anh/chị nhắn lại cho {pronoun} nhé 🌿</Text>
                </Text>
              </View>
            </View>
            <Text style={s.previewNote}>Tên con + số liệu điền tự động cho từng phụ huynh</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom send button */}
      {!sending && (
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 32), backgroundImage: 'linear-gradient(to top, #faf8f2 60%, transparent)' } as any]}>
          <TouchableOpacity style={s.sendBtn} onPress={() => setShowZalo(true)}>
            <IconZalo size={20} color="white" />
            <Text style={s.sendBtnText}>Gửi báo cáo cho {totalCount} phụ huynh</Text>
          </TouchableOpacity>
        </View>
      )}

      {showZalo && (
        <ZaloCopySheet
          title={`Báo cáo tuần · ${className}`}
          recipient={`${totalCount} phụ huynh · ${className}`}
          message={reportMessage}
          hint="từng phụ huynh trong lớp"
          onConfirm={handleSend}
          onClose={() => setShowZalo(false)}
        />
      )}
    </View>
  );
}


const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  // Green hero
  hero: { backgroundColor: colors.green500, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20, overflow: 'hidden' },
  heroEyebrow: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: 'white', letterSpacing: -0.4, marginTop: 6 },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 18, fontWeight: '700', color: 'white', letterSpacing: -0.3 },
  heroStatLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  heroDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' },

  body: { padding: 16 },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 10, marginTop: 18 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 4 },

  // Highlights
  highlightRow: { flexDirection: 'row', gap: 10 },
  highlightCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14 },
  highlightIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  highlightKicker: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginBottom: 4 },
  highlightName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  highlightSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Lessons
  lessonRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  lessonIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' },

  stuRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  stuName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  stuSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  previewBox: { backgroundColor: colors.surfaceAlt, borderRadius: 18, padding: 14 },
  zaloBubble: { backgroundColor: '#5b9bd5', borderRadius: 18, borderBottomRightRadius: 4, padding: 10, paddingHorizontal: 14, maxWidth: '90%' as any },
  previewNote: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: colors.bg },
  sendBtn: { height: 56, borderRadius: 16, backgroundColor: colors.green500, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sendBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
