import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { IconSend, IconStar, IconWarn, IconBook, IconZalo, IconCheck } from '../../components/icons';
import { useClassesStore } from '../../store/classes';
import { generateReport } from '../../api/reports';
import { useAuthStore, isDemoToken } from '../../store/auth';
import { EmptyState } from '../../components/ui/EmptyState';

const VND = (n: number) => (n >= 1000000 ? (n / 1000000).toFixed(1) + 'tr' : n.toLocaleString('vi-VN') + 'đ');

function getMondayOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10);
}

function weekLabel(d = new Date()) {
  const mon = new Date(d);
  const day2 = mon.getDay();
  mon.setDate(mon.getDate() - day2 + (day2 === 0 ? -6 : 1));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (dt: Date) => `${dt.getDate()}/${dt.getMonth() + 1}`;
  return `${fmt(mon)} – ${fmt(sun)}`;
}

const DEMO_CLASSES = [
  { id: 'demo1', name: 'Lớp 9', subject: 'Toán', student_count: 7 },
  { id: 'demo2', name: 'Lớp 10', subject: 'Toán', student_count: 10 },
];

// 8-week attendance trend (%)
const ATTENDANCE_TREND = [82, 85, 80, 88, 90, 85, 88, 88];

// ── Sparkline chart ───────────────────────────────────────────
function AttendanceChart({ data }: { data: number[] }) {
  const max = 100;
  const h = 48;
  return (
    <View style={ch.wrap}>
      {data.map((v, i) => {
        const barH = Math.round((v / max) * h);
        const isCurrent = i === data.length - 1;
        return (
          <View key={i} style={ch.col}>
            <View style={ch.barWrap}>
              <View style={[ch.bar, { height: barH, backgroundColor: isCurrent ? colors.green500 : colors.green100 }]} />
            </View>
            {isCurrent && <Text style={ch.pctLabel}>{v}%</Text>}
          </View>
        );
      })}
    </View>
  );
}
const ch = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 60 },
  col: { flex: 1, alignItems: 'center' },
  barWrap: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  bar: { borderRadius: 4, width: '100%' },
  pctLabel: { fontSize: 10, fontWeight: '700', color: colors.green700, marginTop: 3 },
});

// ── Stat chip ─────────────────────────────────────────────────
function StatChip({ label, value, sub, bg, color }: any) {
  return (
    <View style={[sc.box, { backgroundColor: bg }]}>
      <Text style={[sc.label, { color }]}>{label}</Text>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={[sc.sub, { color: color + 'bb' }]}>{sub}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  box: { flex: 1, borderRadius: 16, padding: 12, minWidth: 0 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginBottom: 3 },
  value: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  sub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
});

// ── Class detail card ─────────────────────────────────────────
function ClassDetailCard({ cls, present, total, paidCount, chapter, divider }: any) {
  const pct = total > 0 ? Math.round(present / total * 100) : 0;
  return (
    <View style={[cd.wrap, divider && cd.divider]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={cd.colorBar} />
        <View style={{ flex: 1 }}>
          <Text style={cd.clsName}>{cls.name} · {cls.subject}</Text>
          <Text style={cd.clsSub}>1.5h · {present}/{total} có mặt</Text>
        </View>
        <Text style={cd.pct}>{pct}%</Text>
      </View>
      <View style={cd.detailRow}>
        <DetailItem label="Buổi" value="1" />
        <DetailItem label="Bài tập" value="Đầy đủ" />
        <DetailItem label="Đã thu" value={`${paidCount}/${total}`} />
        <DetailItem label="Chương" value={chapter} />
      </View>
    </View>
  );
}
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}
const cd = StyleSheet.create({
  wrap: { padding: 14, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  colorBar: { width: 4, height: 36, borderRadius: 2, backgroundColor: colors.green500, marginRight: 12 },
  clsName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  clsSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  pct: { fontSize: 16, fontWeight: '700', color: colors.green700 },
  detailRow: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 10 },
});

// ── Highlight row ─────────────────────────────────────────────
function HighlightRow({ iconBg, iconColor, Icon, title, name, detail, divider }: any) {
  return (
    <View style={[hlRow.row, divider && hlRow.divider]}>
      <View style={[hlRow.iconBox, { backgroundColor: iconBg }]}>
        <Icon size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.2 }}>{title}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 1 }}>{name}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{detail}</Text>
      </View>
    </View>
  );
}
const hlRow = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  iconBox: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ── Honest guiding empty state (real accounts) ────────────────
function ReportGuide({ classes, gw, navigation, week }: any) {
  const firstClass = classes[0];
  const steps = [
    {
      done: classes.length > 0,
      label: 'Tạo lớp học',
      doneText: `✓ ${classes.length} lớp đã tạo`,
      todoText: 'Chưa có lớp nào',
      action: null as null | { label: string; onPress: () => void },
    },
    {
      done: false,
      label: 'Điểm danh buổi đầu',
      doneText: '',
      todoText: 'Chưa có buổi nào',
      action: firstClass
        ? { label: 'Điểm danh', onPress: () => navigation.navigate('Attendance', { classId: firstClass.id, className: firstClass.name }) }
        : null,
    },
    {
      done: false,
      label: 'Ghi nhận học phí',
      doneText: '',
      todoText: 'Chưa thu khoản nào',
      action: null as null | { label: string; onPress: () => void },
    },
  ];

  return (
    <>
      <View style={[s.card, { padding: 18, marginBottom: 8 }]}>
        <Text style={s.emptyTitle}>Chưa đủ dữ liệu thống kê</Text>
        <Text style={[s.emptySub, { textAlign: 'left' }]}>
          {gw === 'thầy' ? 'Thầy' : 'Cô'} điểm danh và ghi nhận học phí vài buổi, app sẽ tự tổng kết tuần ngay tại đây — chứ không bịa số 🌿
        </Text>
      </View>

      <Text style={s.sectionLabel}>ĐỂ CÓ BÁO CÁO ĐẦY ĐỦ</Text>
      <View style={[s.card, { padding: 18 }]}>
        <View style={{ gap: 14 }}>
          {steps.map((st2, i) => {
            const active = !st2.done && steps.slice(0, i).every(x => x.done);
            return (
              <View key={i} style={rg.step}>
                <View style={[rg.bullet, st2.done && rg.bulletDone, active && rg.bulletActive]}>
                  {st2.done
                    ? <IconCheck size={14} color="white" />
                    : <Text style={[rg.bulletNum, active && { color: 'white' }]}>{i + 1}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[rg.stepLabel, st2.done && rg.stepLabelDone]}>{st2.label}</Text>
                  <Text style={[rg.stepSub, st2.done && rg.stepSubDone]}>{st2.done ? st2.doneText : st2.todoText}</Text>
                </View>
                {st2.action && (
                  <TouchableOpacity style={rg.stepBtn} onPress={st2.action.onPress} activeOpacity={0.85}>
                    <Text style={rg.stepBtnText}>{st2.action.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <Text style={s.sectionLabel}>MẪU TIN BÁO CÁO</Text>
      <View style={s.previewBox}>
        <Text style={rg.previewIntro}>Mỗi tuần phụ huynh sẽ nhận tin nhắn như thế này:</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={s.zaloBubble}>
            <Text style={{ fontSize: 13, lineHeight: 20, color: 'white' }}>
              Báo cáo tuần {week} của <Text style={{ fontWeight: '700' }}>[Tên con]</Text>:{'\n'}
              • Đi học: [_/_ buổi]{'\n'}
              • Bài tập: [đánh giá]{'\n'}
              • Học phí: [tình trạng]{'\n'}
              <Text style={{ opacity: 0.85 }}>Mọi thắc mắc anh/chị nhắn {gw} nhé 🌿</Text>
            </Text>
          </View>
        </View>
        <Text style={s.previewNote}>Các ô [...] sẽ tự điền sau khi {gw} điểm danh & thu tiền</Text>
      </View>
    </>
  );
}

const rg = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bullet: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bulletActive: { backgroundColor: colors.green500 },
  bulletDone: { backgroundColor: colors.green500 },
  bulletNum: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  stepLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  stepLabelDone: { color: colors.textSecondary },
  stepSub: { fontSize: 12.5, color: colors.textSecondary, marginTop: 1 },
  stepSubDone: { color: colors.green700, fontWeight: '600' },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green200, flexShrink: 0 },
  stepBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.green700 },
  previewIntro: { fontSize: 12.5, color: colors.textSecondary, marginBottom: 10 },
});

// ── Main screen ───────────────────────────────────────────────

export function ReportTabScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { classes, fetchClasses } = useClassesStore();
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const gw = useAuthStore(st => st.teacher?.gender) === 'thay' ? 'thầy' : 'cô';
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [showZalo, setShowZalo] = useState(false);
  const [classFilter, setClassFilter] = useState<string>(route?.params?.filterClassId ?? 'all');
  const [loading, setLoading] = useState(!isDemo);

  const allClasses = isDemo ? (DEMO_CLASSES as any[]) : classes;
  const validClassIds = new Set(['all', ...allClasses.map((c: any) => c.id)]);
  const effectiveFilter = validClassIds.has(classFilter) ? classFilter : 'all';
  const displayClasses = effectiveFilter === 'all' ? allClasses : allClasses.filter((c: any) => c.id === effectiveFilter);
  const originClassId: string | undefined = route?.params?.filterClassId;
  const originClass = originClassId ? (classes as any[]).find(c => c.id === originClassId) : undefined;
  const realTotalStudents = displayClasses.reduce((a: number, c: any) => a + (c.student_count || 0), 0);
  const totalStudents = isDemo ? (realTotalStudents || 17) : realTotalStudents;
  const presentCount = totalStudents - 2;

  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    setLoading(true);
    Promise.resolve(fetchClasses()).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [isDemo]);

  const handleConfirmSend = async () => {
    setShowZalo(false);
    setSending(true);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 1;
      setProgress(p);
      if (p >= totalStudents) { clearInterval(interval); setTimeout(() => setDone(true), 200); }
    }, 80);
    if (isDemo) return;
    try {
      await Promise.all(displayClasses.map((cls: any) => generateReport(cls.id, getMondayOfWeek())));
    } catch {
      Alert.alert('Chưa gửi được', 'Không tạo được báo cáo. Kiểm tra mạng và thử lại.');
    }
  };

  if (done) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <View style={s.successCircle}>
          <Text style={{ fontSize: 48, color: colors.green600 }}>✓</Text>
        </View>
        <Text style={s.successTitle}>Đã gửi {totalStudents} báo cáo</Text>
        <Text style={s.successSub}>Phụ huynh sẽ nhận báo cáo tuần qua Zalo trong vài phút.</Text>
        <TouchableOpacity style={s.ghostBtn} onPress={() => { setDone(false); navigation.navigate('MainTabs', { screen: 'Home' }); }}>
          <Text style={s.ghostBtnText}>Về trang chính</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={colors.green500} size="large" />
      </View>
    );
  }

  if (!isDemo && allClasses.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Báo cáo</Text>
            <Text style={s.subtitle}>{weekLabel()}</Text>
          </View>
        </View>
        <EmptyState
          icon="📊"
          title="Chưa có lớp để làm báo cáo"
          subtitle="Tạo lớp và thêm học sinh, rồi mỗi tuần app sẽ tổng kết đi học & học phí để bạn gửi phụ huynh qua Zalo."
          ctaLabel="+ Tạo lớp học"
          onCta={() => navigation.navigate('CreateClass')}
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Báo cáo</Text>
          <Text style={s.subtitle}>{weekLabel()} · {displayClasses.length} lớp</Text>
        </View>
      </View>

      {/* Breadcrumb — shown when navigated from ClassDetail */}
      {originClass && (
        <TouchableOpacity
          style={s.breadcrumb}
          onPress={() => navigation.navigate('ClassDetail', { classId: originClassId, className: originClass.name })}
        >
          <Text style={s.breadcrumbText}>‹ {originClass.name}</Text>
        </TouchableOpacity>
      )}

      {/* Class filter chips */}
      <ScrollView horizontal style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row', alignItems: 'center' }} showsHorizontalScrollIndicator={false}>
        {[{ id: 'all', name: 'Tất cả' }, ...allClasses].map((c: any) => (
          <TouchableOpacity
            key={c.id}
            style={[s.clsChip, effectiveFilter === c.id && s.clsChipActive]}
            onPress={() => setClassFilter(c.id)}
          >
            <Text style={[s.clsChipText, effectiveFilter === c.id && s.clsChipTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: (sending ? 24 : 110) + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats + trend (demo only — số liệu thật chưa đủ để tổng hợp) ── */}
        {isDemo ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <StatChip
                label="BUỔI ĐÃ DẠY"
                value={String(displayClasses.length * 2)}
                sub="100% kế hoạch"
                bg={colors.green100}
                color={colors.green700}
              />
              <StatChip
                label="CÓ MẶT"
                value={`${presentCount}/${totalStudents}`}
                sub="↑ 6%"
                bg="#f0faf4"
                color={colors.green700}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <StatChip
                label="ĐÃ THU"
                value="5,4tr"
                sub="↑ 1,2tr"
                bg={colors.honey100}
                color="#8a6d30"
              />
              <StatChip
                label="VẮNG"
                value="2"
                sub="2 học sinh"
                bg={colors.coral100}
                color={colors.coral700}
              />
            </View>

            {/* ── Attendance trend ── */}
            <View style={s.card} >
              <View style={{ padding: 14, paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={s.cardTitle}>Tỉ lệ chuyên cần</Text>
                  <Text style={s.cardSub}>8 tuần gần đây</Text>
                </View>
                <AttendanceChart data={ATTENDANCE_TREND} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>01/04</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>20/05</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <ReportGuide classes={allClasses} gw={gw} navigation={navigation} week={weekLabel()} />
        )}

        {/* ── Per-class detail (demo only — số liệu buổi/bài tập chưa có cho lớp thật) ── */}
        {isDemo && (
          <>
            <Text style={s.sectionLabel}>BÁO CÁO TỪNG LỚP</Text>
            <View style={s.card}>
              {displayClasses.map((cls: any, i: number) => {
                const present = (cls.student_count || 1) - 1;
                const chapters = ['Ch.7', 'Ch.4'];
                const paidCount = i === 0 ? 4 : 7;
                return (
                  <ClassDetailCard
                    key={cls.id}
                    cls={cls}
                    present={present}
                    total={cls.student_count}
                    paidCount={paidCount}
                    chapter={chapters[i] || 'Ch.1'}
                    divider={i > 0}
                  />
                );
              })}
            </View>

            {/* ── Highlights ── */}
            <Text style={s.sectionLabel}>NỔI BẬT</Text>
            <View style={s.card}>
              <HighlightRow
                iconBg={colors.honey100} iconColor="#8a6d30" Icon={IconStar}
                title="HỌC SINH TIẾN BỘ NHẤT"
                name="Mai Khánh Linh"
                detail={`${displayClasses[1]?.name || 'Lớp 10'} · chuyên cần 100% 4 tuần liền`}
              />
              <HighlightRow
                iconBg={colors.coral100} iconColor={colors.coral700} Icon={IconWarn}
                title="CẦN LƯU Ý"
                name="Bùi Nam Sơn"
                detail="Vắng 3 buổi / 5 buổi gần nhất"
                divider
              />
              <HighlightRow
                iconBg={colors.green100} iconColor={colors.green700} Icon={IconBook}
                title="BÀI ĐÃ DẠY"
                name="Hình học Ch.7 · Đại số Ch.4"
                detail={`${displayClasses[0]?.name || 'Lớp 9'} · ${displayClasses[1]?.name || 'Lớp 10'}`}
                divider
              />
            </View>
          </>
        )}

        {/* ── Zalo preview (demo only — real accounts see the honest MẪU TIN above) ── */}
        {isDemo && (
          <>
            <Text style={s.sectionLabel}>TIN NHẮN GỬI PHỤ HUYNH</Text>
            <View style={s.previewBox}>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={s.zaloBubble}>
                  <Text style={{ fontSize: 13, lineHeight: 20, color: 'white' }}>
                    Báo cáo tuần {weekLabel()} của <Text style={{ fontWeight: '700' }}>[Tên con]</Text>:{'\n'}
                    • Đi học: 1/1 buổi{'\n'}
                    • Bài tập: làm đầy đủ{'\n'}
                    • Học phí: đã thu T5{'\n'}
                    <Text style={{ opacity: 0.85 }}>Mọi thắc mắc anh/chị nhắn lại cho {gw} nhé. Cảm ơn! 🌿</Text>
                  </Text>
                </View>
              </View>
              <Text style={s.previewNote}>Tên con và số liệu được điền tự động cho từng phụ huynh</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom bar */}
      {!sending ? (
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 32), backgroundImage: 'linear-gradient(to top, #f7f5f0 60%, transparent)' } as any]}>
          <TouchableOpacity style={s.btnPrimary} onPress={() => setShowZalo(true)}>
            <IconZalo size={20} color="white" />
            <Text style={s.btnPrimaryText}>Soạn báo cáo Zalo · {totalStudents} phụ huynh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[s.sendingBar, { paddingBottom: Math.max(insets.bottom + 16, 36) }]}>
          <View style={s.sendingIcon}><IconSend size={18} color={colors.green600} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Đang gửi Zalo...</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{progress}/{totalStudents} phụ huynh</Text>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress / totalStudents * 100}%` as any }]} />
            </View>
          </View>
        </View>
      )}

      {showZalo && (
        <ZaloCopySheet
          title={`Báo cáo tuần · ${totalStudents} phụ huynh`}
          recipient={`${totalStudents} phụ huynh · ${displayClasses.length} lớp`}
          message={`Báo cáo tuần ${weekLabel()} của [Tên con]:\n• Đi học: 1/1 buổi\n• Bài tập: làm đầy đủ\n• Học phí: đã thu T${new Date().getMonth() + 1}\n\nMọi thắc mắc anh/chị nhắn lại cho ${gw} nhé. Cảm ơn! 🌿`}
          hint="nhóm lớp hoặc từng phụ huynh"
          onConfirm={handleConfirmSend}
          onClose={() => setShowZalo(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.4, marginBottom: 10, marginTop: 16 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cardSub: { fontSize: 12, color: colors.textSecondary },
  previewBox: { backgroundColor: colors.surfaceAlt, borderRadius: 18, padding: 14, marginBottom: 16 },
  zaloBubble: { backgroundColor: '#5b9bd5', borderRadius: 18, borderBottomRightRadius: 4, padding: 10, paddingHorizontal: 14, maxWidth: '90%' as any },
  previewNote: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16 },
  sendingBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sendingIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.green50, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.green500 },
  btnPrimary: { height: 56, borderRadius: 16, backgroundColor: colors.green500, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '600' },
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  successTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: colors.textPrimary, marginBottom: 6 },
  successSub: { fontSize: 14, color: colors.textSecondary, maxWidth: 280, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  ghostBtn: { padding: 12 },
  ghostBtnText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  breadcrumb: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colors.green50, borderBottomWidth: 1, borderBottomColor: colors.green100 },
  breadcrumbText: { fontSize: 13, fontWeight: '600', color: colors.green700 },
  clsChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white', alignSelf: 'center' },
  clsChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  clsChipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  clsChipTextActive: { color: colors.green700 },
});
