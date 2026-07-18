import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { classColor } from '../../theme/classColors';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { SuccessScreen } from '../../components/ui/SuccessScreen';
import { Button } from '../../components/ui/Button';
import { IconZalo, IconStar, IconWarn, IconBook } from '../../components/icons';
import { useClassesStore } from '../../store/classes';
import { generateReport } from '../../api/reports';
import { listSessions } from '../../api/attendance';
import { getTuition } from '../../api/tuition';
import { useAuthStore, isDemoToken } from '../../store/auth';
import { localMonth } from '../../utils/date';

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
  const [sessions, setSessions] = useState<any[]>([]);
  const [tuitionRows, setTuitionRows] = useState<any[]>([]);

  const klass = classes.find(c => c.id === classId);
  const classStudents = students[classId] || [];

  // Số liệu THẬT từng học sinh (điểm danh + học phí tháng này).
  const realReport = classStudents.map(s => {
    let marks = 0, present = 0;
    for (const sess of sessions) {
      const rec = sess.records?.find((r: any) => r.student_id === s.id);
      if (rec) { marks++; if (rec.present) present++; }
    }
    const trow = tuitionRows.find((t: any) => t.student_id === s.id);
    return {
      name: s.name,
      attend: marks ? Math.round(present / marks * 100) : 0,
      paid: !!(trow && trow.paid),
      hasData: marks > 0,
    };
  });

  const stuReport = isDemo
    ? DEMO_STU_REPORT.map(s => ({ ...s, hasData: true }))
    : realReport;

  const totalCount = stuReport.length;
  const presentCount = stuReport.filter(s => s.attend === 100).length;

  // Số buổi đã dạy + chuyên cần trung bình + đã thu — THẬT (demo dùng số minh hoạ).
  const sessionCount = isDemo ? 1 : sessions.length;
  let totMarks = 0, totPresent = 0;
  sessions.forEach(sess => sess.records?.forEach((r: any) => { totMarks++; if (r.present) totPresent++; }));
  const avgAttendPct = isDemo
    ? Math.round(DEMO_STU_REPORT.reduce((a, s) => a + s.attend, 0) / DEMO_STU_REPORT.length)
    : (totMarks ? Math.round(totPresent / totMarks * 100) : 0);
  const collected = isDemo
    ? DEMO_STU_REPORT.filter(s => s.paid).length * 500000
    : tuitionRows.filter((t: any) => t.paid).reduce((a: number, t: any) => a + (t.amount || 0), 0);

  // Có số liệu thật để hiển thị? (đã điểm danh hoặc đã thu học phí)
  const hasRealData = !isDemo && (sessions.length > 0 || collected > 0);

  // Nổi bật (cả demo lẫn thật): chỉ xét học sinh CÓ dữ liệu.
  const withData = stuReport.filter((s: any) => s.hasData);
  const topStudent = (isDemo || hasRealData)
    ? (withData.find((st: any) => st.attend === 100 && st.paid) || withData.find((st: any) => st.attend >= 90))
    : undefined;
  const watchStudent = (isDemo || hasRealData) && withData.length
    ? withData.reduce((lo: any, st: any) => (st.attend < lo.attend ? st : lo), withData[0])
    : undefined;

  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    setLoading(true);
    const month = localMonth();
    Promise.all([
      Promise.resolve(fetchStudents(classId)),
      listSessions(classId).then((r: any) => { if (alive) setSessions(r || []); }).catch(() => {}),
      getTuition(classId, month).then((r: any) => { if (alive) setTuitionRows(r || []); }).catch(() => {}),
    ]).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [classId, isDemo]);

  // ── Tin nhóm theo KỲ: Ngày (buổi gần nhất) / Tuần / Tháng ──
  // Ngày: sĩ số + tên vắng + hôm nay học gì + dặn dò (ghi lúc điểm danh).
  // Tuần/Tháng: số buổi, chuyên cần, các bài đã học, học phí. Toàn bộ là số THẬT.
  const [range, setRange] = useState<'day' | 'week' | 'month'>('day');
  const fmtD = (ymd: string) => { const p = ymd.split('-'); return `${p[2]}/${Number(p[1])}`; };
  const sortedSessions = [...sessions].sort((a: any, b: any) => (a.session_date < b.session_date ? 1 : -1));
  const latest = sortedSessions[0];
  const monthKey = localMonth();
  const weekMon = (() => { const d = new Date(); const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const rangeSessions = range === 'day'
    ? (latest ? [latest] : [])
    : sortedSessions.filter((sx: any) => range === 'week' ? sx.session_date >= weekMon : sx.session_date.slice(0, 7) === monthKey);

  const buildRangeMessage = (): string => {
    const Gw = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
    if (range === 'day') {
      if (!latest) return `Kính gửi quý phụ huynh ${className}, lớp chưa có buổi học nào được điểm danh. ${Gw} sẽ gửi báo cáo sau buổi học đầu tiên nhé 🌿`;
      const recs: any[] = latest.records || [];
      const absent = recs.filter(r => !r.present);
      const lines = [
        `📋 Báo cáo buổi học ${fmtD(latest.session_date)} · ${className}`,
        `Sĩ số: ${recs.length - absent.length}/${recs.length}`,
        absent.length > 0
          ? 'Vắng: ' + absent.map(r => (r.student_name || 'HS').split(' ').slice(-1)[0] + (r.absence_reason ? ` (${r.absence_reason})` : '')).join(', ')
          : 'Cả lớp có mặt đầy đủ 🎉',
      ];
      if (latest.lesson_note) lines.push(`📖 Hôm nay học: ${latest.lesson_note}`);
      if (latest.homework_note) lines.push(`📝 Dặn dò các con: ${latest.homework_note}`);
      lines.push(`${Gw} cảm ơn quý phụ huynh! 🌿`);
      return lines.join('\n');
    }
    // Tuần / Tháng
    const label = range === 'week' ? `tuần ${weekLabel()}` : `tháng ${Number(monthKey.split('-')[1])}`;
    let marks = 0, present = 0;
    const absentNames = new Set<string>();
    rangeSessions.forEach((sx: any) => sx.records?.forEach((r: any) => {
      marks++; if (r.present) present++;
      else if (r.student_name) absentNames.add(r.student_name.split(' ').slice(-1)[0]);
    }));
    const pct = marks ? Math.round(present / marks * 100) : 0;
    const lessons = rangeSessions.map((sx: any) => sx.lesson_note).filter(Boolean);
    const lines = [`📋 Báo cáo ${label} · ${className}`];
    if (rangeSessions.length > 0) {
      lines.push(`• ${rangeSessions.length} buổi học · chuyên cần ${pct}%`);
      lines.push(absentNames.size > 0 ? `• Có vắng: ${[...absentNames].join(', ')}` : '• Không bạn nào vắng 🎉');
      if (lessons.length > 0) lines.push(`📖 Đã học: ${lessons.join('; ')}`);
      const hw = rangeSessions.find((sx: any) => sx.homework_note)?.homework_note;
      if (hw) lines.push(`📝 Dặn dò mới nhất: ${hw}`);
    } else {
      lines.push(`• Chưa có buổi học nào trong ${label}`);
    }
    if (range === 'month' && collected > 0) lines.push(`• Học phí: ${pronoun} đã cập nhật, phụ huynh nào chưa nộp ${pronoun} sẽ nhắn riêng`);
    lines.push(`Phụ huynh muốn biết chi tiết của bé nhà mình thì nhắn ${pronoun} nhé. Cảm ơn quý phụ huynh! 🌿`);
    return lines.join('\n');
  };

  const reportMessage = isDemo
    ? `Kính gửi quý phụ huynh ${className},\n\nBáo cáo tuần ${weekLabel()}: lớp học 1 buổi, các con đi học đầy đủ. Phụ huynh muốn biết chi tiết của bé nhà mình thì nhắn ${pronoun} nhé. Cảm ơn quý phụ huynh! 🌿`
    : buildRangeMessage();

  const handleSend = async () => {
    setShowZalo(false);
    setSending(true);
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
        title="Đã gửi báo cáo tuần"
        sub={`Bạn đã gửi tin cho nhóm ${className} qua Zalo. Muốn gửi riêng từng bé (kèm tên & số liệu), mở học sinh rồi chọn "Gửi thiệp báo cáo".`}
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
            <HeroStat label="Buổi dạy" value={String(sessionCount)} />
            <View style={s.heroDivider} />
            <HeroStat label="Chuyên cần" value={isDemo ? `${presentCount}/${totalCount}` : (sessions.length ? `${avgAttendPct}%` : '—')} />
            <View style={s.heroDivider} />
            <HeroStat label="Đã thu" value={collected > 0 ? VND(collected) : '—'} />
          </View>
        </View>

        <View style={s.body}>

          {/* Nổi bật tuần này — hiện khi có số liệu (demo hoặc thật) */}
          {(isDemo || hasRealData) && topStudent && watchStudent && (
            <>
              <Text style={s.sectionLabel}>NỔI BẬT TUẦN NÀY</Text>
              <View style={s.highlightRow}>
                <View style={[s.highlightCard, { backgroundColor: colors.green50, borderColor: colors.green200 }]}>
                  <View style={[s.highlightIcon, { backgroundColor: colors.green100 }]}>
                    <IconStar size={16} color={colors.green700} />
                  </View>
                  <Text style={[s.highlightKicker, { color: colors.green700 }]}>TIẾN BỘ NHẤT</Text>
                  <Text style={s.highlightName} numberOfLines={1}>{topStudent.name}</Text>
                  <Text style={s.highlightSub}>Chuyên cần {topStudent.attend}%{topStudent.paid ? ', đã nộp phí' : ''}</Text>
                </View>
                <View style={[s.highlightCard, { backgroundColor: colors.coral50, borderColor: colors.coral100 }]}>
                  <View style={[s.highlightIcon, { backgroundColor: colors.coral100 }]}>
                    <IconWarn size={16} color={colors.coral700} />
                  </View>
                  <Text style={[s.highlightKicker, { color: colors.coral700 }]}>CẦN LƯU Ý</Text>
                  <Text style={s.highlightName} numberOfLines={1}>{watchStudent.name}</Text>
                  <Text style={s.highlightSub}>Chuyên cần {watchStudent.attend}%{!watchStudent.paid ? ', chưa nộp phí' : ''}</Text>
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

          {/* Chỉ hiện khi THẬT SỰ chưa có số liệu (chưa điểm danh & chưa thu) */}
          {!isDemo && !hasRealData && (
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
                    {(isDemo || (stu as any).hasData)
                      ? (stu.attend === 100 ? 'Có mặt đầy đủ' : `Chuyên cần ${stu.attend}%`)
                      : 'Chưa có dữ liệu'}
                  </Text>
                </View>
                {(isDemo || (stu as any).hasData) && (
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={[s.badge, { backgroundColor: stu.attend >= 75 ? colors.green100 : colors.coral100 }]}>
                      <Text style={[s.badgeText, { color: stu.attend >= 75 ? colors.green700 : colors.coral700 }]}>
                        {stu.attend === 100 ? 'Có mặt' : stu.attend >= 75 ? 'Đi đều' : 'Vắng nhiều'}
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
          <Text style={s.sectionLabel}>TIN GỬI NHÓM PHỤ HUYNH</Text>
          {/* Chọn kỳ báo cáo: buổi hôm nay / tuần / tháng */}
          {!isDemo && (
            <View style={s.rangeRow}>
              {([['day', 'Buổi học'], ['week', 'Tuần'], ['month', 'Tháng']] as const).map(([k, lbl]) => (
                <TouchableOpacity
                  key={k}
                  style={[s.rangeChip, range === k && s.rangeChipActive]}
                  onPress={() => setRange(k)}
                >
                  <Text style={[s.rangeChipText, range === k && s.rangeChipTextActive]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={s.previewBox}>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={s.zaloBubble}>
                <Text style={{ fontSize: 13, lineHeight: 20, color: 'white' }}>{reportMessage}</Text>
              </View>
            </View>
            <Text style={s.previewNote}>
              Tin dùng số liệu thật của lớp (điểm danh + "hôm nay học gì" ghi lúc điểm danh). Muốn gửi riêng từng bé — mở hồ sơ học sinh, chọn "Gửi thiệp báo cáo".
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom send button */}
      {!sending && (
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 32), backgroundImage: 'linear-gradient(to top, #faf8f2 60%, transparent)' } as any]}>
          <Button label="Soạn báo cáo tuần · gửi nhóm lớp" onPress={() => setShowZalo(true)} icon={<IconZalo size={16} color="#fff" />} />
        </View>
      )}

      {showZalo && (
        <ZaloCopySheet
          title={`Báo cáo tuần · ${className}`}
          recipient={`Nhóm Zalo ${className}`}
          message={reportMessage}
          hint="nhóm lớp"
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
  highlightKicker: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginBottom: 4 },
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
  badgeText: { fontSize: 12, fontWeight: '600' },

  previewBox: { backgroundColor: colors.surfaceAlt, borderRadius: 18, padding: 14 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  rangeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'white', alignItems: 'center' },
  rangeChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  rangeChipText: { fontSize: 13.5, fontWeight: '600', color: colors.textSecondary },
  rangeChipTextActive: { color: colors.green700 },
  zaloBubble: { backgroundColor: '#5b9bd5', borderRadius: 18, borderBottomRightRadius: 4, padding: 10, paddingHorizontal: 14, maxWidth: '90%' as any },
  previewNote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: colors.bg },
});
