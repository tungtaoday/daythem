import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { IconZalo, IconSend, IconCheck, IconWallet } from '../../components/icons';
import { useClassesStore } from '../../store/classes';
import { getTuition, recordPayment } from '../../api/tuition';
import { useAuthStore, isDemoToken } from '../../store/auth';
import { EmptyState } from '../../components/ui/EmptyState';

const VND_FULL = (n: number) => n.toLocaleString('vi-VN') + 'đ';

const buildZaloTemplates = (gw: string) => {
  const Gw = gw.charAt(0).toUpperCase() + gw.slice(1);
  return [
    { tone: 'Nhẹ nhàng', body: `Chào anh/chị! ${Gw} nhắc nhẹ là tháng này con vẫn còn thiếu học phí. Anh/chị tiện thì gửi ${gw} trong tuần này nhé 🌿` },
    { tone: 'Trực tiếp', body: `Anh/chị ơi, con đang nợ học phí tháng này. Tuần này nhớ gửi cho ${gw} nhé. Cảm ơn anh/chị.` },
    { tone: 'Có chuyển khoản', body: `Chào anh/chị, học phí con tháng này. Anh/chị chuyển khoản giúp ${gw} theo số tài khoản ${gw} đã gửi nhé. Cảm ơn anh/chị! 🌿` },
  ];
};

// ── Demo data ─────────────────────────────────────────────────

type Item = {
  student_id: string; student_name: string;
  amount: number; paid: boolean; classId: string; className: string;
};

const DEMO_TUITION: Item[] = [
  { student_id: 'd1', student_name: 'Nguyễn Minh Anh', amount: 500000, paid: true, classId: 'c1', className: 'Lớp 9' },
  { student_id: 'd2', student_name: 'Trần Bảo Long', amount: 500000, paid: false, classId: 'c1', className: 'Lớp 9' },
  { student_id: 'd3', student_name: 'Lê Hoàng Phúc', amount: 500000, paid: true, classId: 'c1', className: 'Lớp 9' },
  { student_id: 'd4', student_name: 'Phạm Quỳnh Như', amount: 500000, paid: false, classId: 'c1', className: 'Lớp 9' },
  { student_id: 'd5', student_name: 'Đỗ Minh Khôi', amount: 500000, paid: true, classId: 'c1', className: 'Lớp 9' },
  { student_id: 'd6', student_name: 'Vũ Hà My', amount: 500000, paid: true, classId: 'c1', className: 'Lớp 9' },
  { student_id: 'd7', student_name: 'Bùi Nam Sơn', amount: 500000, paid: false, classId: 'c1', className: 'Lớp 9' },
  { student_id: 'd8', student_name: 'Hoàng Tuấn Kiệt', amount: 600000, paid: true, classId: 'c2', className: 'Lớp 10' },
  { student_id: 'd9', student_name: 'Mai Khánh Linh', amount: 600000, paid: true, classId: 'c2', className: 'Lớp 10' },
  { student_id: 'd10', student_name: 'Trương Gia Hân', amount: 600000, paid: false, classId: 'c2', className: 'Lớp 10' },
  { student_id: 'd11', student_name: 'Đặng Hữu Thắng', amount: 600000, paid: true, classId: 'c2', className: 'Lớp 10' },
  { student_id: 'd12', student_name: 'Lý Bích Ngọc', amount: 600000, paid: false, classId: 'c2', className: 'Lớp 10' },
  { student_id: 'd13', student_name: 'Phan Tấn Phát', amount: 600000, paid: true, classId: 'c2', className: 'Lớp 10' },
  { student_id: 'd14', student_name: 'Ngô Thuỳ Dương', amount: 600000, paid: true, classId: 'c2', className: 'Lớp 10' },
  { student_id: 'd15', student_name: 'Cao Việt Hưng', amount: 600000, paid: false, classId: 'c2', className: 'Lớp 10' },
  { student_id: 'd16', student_name: 'Trịnh Yến Nhi', amount: 600000, paid: true, classId: 'c2', className: 'Lớp 10' },
  { student_id: 'd17', student_name: 'Hồ Quang Duy', amount: 600000, paid: true, classId: 'c2', className: 'Lớp 10' },
];

const DEMO_TRANSACTIONS = [
  { name: 'Hoàng Tuấn Kiệt', cls: 'Lớp 10', when: 'Hôm nay · 14:22', amt: 600000 },
  { name: 'Mai Khánh Linh', cls: 'Lớp 10', when: 'Hôm qua · 19:05', amt: 600000 },
  { name: 'Phan Tấn Phát', cls: 'Lớp 10', when: 'Hôm qua · 09:30', amt: 600000 },
  { name: 'Nguyễn Minh Anh', cls: 'Lớp 9', when: '17/05 · 20:12', amt: 500000 },
  { name: 'Đỗ Minh Khôi', cls: 'Lớp 9', when: '15/05', amt: 0, note: 'Học bổng — miễn phí' },
];

const MONTHLY_TREND = [
  { label: 'T1', amt: 5800000 },
  { label: 'T2', amt: 6200000 },
  { label: 'T3', amt: 6000000 },
  { label: 'T4', amt: 5900000 },
  { label: 'T5', amt: 6200000 },
];

// ── Components ────────────────────────────────────────────────

function MiniBarChart({ data }: { data: typeof MONTHLY_TREND }) {
  const maxAmt = Math.max(...data.map(d => d.amt));
  const currentIdx = data.length - 1;
  return (
    <View style={bc.wrap}>
      {data.map((d, i) => {
        const h = Math.round((d.amt / maxAmt) * 52);
        const isCurrent = i === currentIdx;
        return (
          <View key={d.label} style={bc.col}>
            <View style={bc.barWrap}>
              <View style={[bc.bar, { height: h, backgroundColor: isCurrent ? colors.green500 : colors.green100 }]} />
            </View>
            <Text style={[bc.label, isCurrent && { color: colors.green700, fontWeight: '700' }]}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
const bc = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 68, paddingTop: 4 },
  col: { flex: 1, alignItems: 'center' },
  barWrap: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  bar: { borderRadius: 5, width: '100%' },
  label: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginTop: 4 },
});

function ClassBreakdown({ cls, paidCount, totalCount, paidAmt, targetAmt }: any) {
  const pct = totalCount > 0 ? paidCount / totalCount : 0;
  return (
    <View style={cb.row}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={cb.clsName}>{cls}</Text>
          <Text style={cb.paidLabel}>{VND_FULL(paidAmt)} / {VND_FULL(targetAmt)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={cb.paidRatio}>{paidCount}/{totalCount} đã nộp</Text>
          <Text style={cb.pct}>{Math.round(pct * 100)}%</Text>
        </View>
        <View style={cb.track}>
          <View style={[cb.fill, { width: `${pct * 100}%` as any }]} />
        </View>
      </View>
    </View>
  );
}
const cb = StyleSheet.create({
  row: { padding: 14, paddingHorizontal: 16 },
  clsName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  paidLabel: { fontSize: 13, fontWeight: '600', color: colors.green700 },
  paidRatio: { fontSize: 12, color: colors.textSecondary },
  pct: { fontSize: 12, fontWeight: '700', color: colors.green700 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.green500 },
});

// ── Main screen ───────────────────────────────────────────────

export function TuitionTabScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { classes, fetchClasses } = useClassesStore();
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const teacher = useAuthStore(st => st.teacher);
  const pronoun = teacher?.gender === 'thay' ? 'thầy' : 'cô';
  const zaloTemplates = buildZaloTemplates(pronoun);
  const originClassId: string | undefined = route?.params?.filterClassId;
  const originClass = originClassId ? classes.find(c => c.id === originClassId) : undefined;
  const [allData, setAllData] = useState<Item[]>([]);
  const [demoData, setDemoData] = useState<Item[]>(DEMO_TUITION);
  const [loading, setLoading] = useState(!isDemo);
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [sent, setSent] = useState(false);
  const [classFilter, setClassFilter] = useState<string>(route?.params?.filterClassId ?? 'all');
  const month = new Date().toISOString().slice(0, 7);
  const monthLabel = `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

  useEffect(() => { if (!isDemo) fetchClasses(); }, [isDemo]);
  useEffect(() => {
    if (isDemo) return;
    if (classes.length === 0) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    Promise.all(
      classes.map(cls =>
        getTuition(cls.id, month)
          .then((rows: any[]) => rows.map(r => ({ ...r, classId: cls.id, className: cls.name })))
          .catch(() => [] as Item[])
      )
    )
      .then(res => { if (alive) setAllData(res.flat()); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [classes, isDemo]);

  const rawData = isDemo ? demoData : allData;
  const allClassIds = [...new Set(rawData.map(d => d.classId))];
  const allClassChips = allClassIds.map(cid => ({ id: cid, name: rawData.find(d => d.classId === cid)!.className }));
  const effectiveFilter = new Set(['all', ...allClassIds]).has(classFilter) ? classFilter : 'all';
  const displayData = effectiveFilter === 'all' ? rawData : rawData.filter(d => d.classId === effectiveFilter);

  const paidList = displayData.filter(d => d.paid);
  const unpaidList = displayData.filter(d => !d.paid);
  const totalPaid = paidList.reduce((a, d) => a + (d.amount || 0), 0);
  const totalUnpaid = unpaidList.reduce((a, d) => a + (d.amount || 0), 0);
  const totalTarget = displayData.reduce((a, d) => a + (d.amount || 0), 0);
  const pctGoal = totalTarget > 0 ? totalPaid / totalTarget : 0;
  const studentCount = displayData.length;
  const nothingYet = totalPaid === 0 && studentCount > 0;

  // Per-class breakdown
  const classIds = [...new Set(displayData.map(d => d.classId))];
  const classBreakdowns = classIds.map(cid => {
    const items = displayData.filter(d => d.classId === cid);
    const paid = items.filter(d => d.paid);
    return {
      id: cid,
      name: items[0].className,
      paidCount: paid.length,
      totalCount: items.length,
      paidAmt: paid.reduce((a, d) => a + d.amount, 0),
      targetAmt: items.reduce((a, d) => a + d.amount, 0),
    };
  });

  const markPaid = (item: Item) => {
    if (isDemo) {
      setDemoData(d => d.map(x => x.student_id === item.student_id ? { ...x, paid: true } : x));
      return;
    }
    // Optimistic tick
    setAllData(d => d.map(x => x.student_id === item.student_id && x.classId === item.classId ? { ...x, paid: true } : x));
    recordPayment(item.classId, { student_id: item.student_id, paid: true, amount: item.amount, month }).catch(() => {
      // Roll back and tell the teacher it didn't save
      setAllData(d => d.map(x => x.student_id === item.student_id && x.classId === item.classId ? { ...x, paid: false } : x));
      Alert.alert('Chưa lưu được', 'Không ghi nhận được khoản thu. Kiểm tra mạng và thử lại.');
    });
  };

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={colors.green500} size="large" />
      </View>
    );
  }

  if (!isDemo && rawData.length === 0) {
    const hasClass = classes.length > 0;
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Học phí</Text>
            <Text style={s.subtitle}>{monthLabel}</Text>
          </View>
          <TouchableOpacity style={s.taxBtn} onPress={() => navigation.navigate('Tax')}>
            <IconWallet size={15} color={colors.green700} />
            <Text style={s.taxBtnText}>Thuế TNCN</Text>
          </TouchableOpacity>
        </View>
        <EmptyState
          icon="💰"
          title={hasClass ? 'Chưa có học sinh để thu học phí' : 'Chưa có lớp nào'}
          subtitle={hasClass
            ? 'Thêm học sinh vào lớp, rồi tick "đã thu" mỗi khi phụ huynh nộp — app tự tổng hợp & nhắc giúp.'
            : 'Tạo lớp đầu tiên để bắt đầu theo dõi học phí từng tháng.'}
          ctaLabel={hasClass ? '+ Thêm học sinh' : '+ Tạo lớp học'}
          onCta={() => hasClass
            ? navigation.navigate('ClassStudents', { classId: classes[0].id, className: classes[0].name })
            : navigation.navigate('CreateClass')}
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Học phí</Text>
          <Text style={s.subtitle}>{monthLabel}</Text>
        </View>
        <TouchableOpacity style={s.taxBtn} onPress={() => navigation.navigate('Tax')}>
          <IconWallet size={15} color={colors.green700} />
          <Text style={s.taxBtnText}>Thuế TNCN</Text>
        </TouchableOpacity>
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
        {[{ id: 'all', label: 'Tất cả' }, ...allClassChips.map(c => ({ id: c.id, label: c.name }))].map(chip => (
          <TouchableOpacity
            key={chip.id}
            style={[s.chip, effectiveFilter === chip.id && s.chipActive]}
            onPress={() => setClassFilter(chip.id)}
          >
            <Text style={[s.chipText, effectiveFilter === chip.id && s.chipTextActive]}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── Revenue summary hero ── */}
        <View style={s.heroCard}>
          <View style={s.heroTopRow}>
            <Text style={s.heroLabel}>ĐÃ THU THÁNG NÀY</Text>
            <View style={s.heroBadge}>
              <IconWallet size={15} color={colors.green700} />
            </View>
          </View>
          <Text style={s.heroAmt}>{VND_FULL(totalPaid)}</Text>

          {nothingYet ? (
            <View style={s.heroEncourageRow}>
              <Text style={s.heroEncourageEmoji}>🌿</Text>
              <Text style={s.heroEncourage}>
                {studentCount} học sinh · đầu tháng, chưa thu khoản nào
              </Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 10 }}>
                <Text style={s.heroSub}>{Math.round(pctGoal * 100)}% mục tiêu</Text>
                <Text style={s.heroSub2}>Còn thiếu {VND_FULL(totalUnpaid)}</Text>
              </View>
              <View style={s.heroTrack}>
                <View style={[s.heroFill, { width: `${pctGoal * 100}%` as any }]} />
              </View>
            </>
          )}

          {/* Monthly trend chart — chỉ hiện cho phiên demo. Tài khoản thật chưa đủ
              dữ liệu lịch sử nên không dựng biểu đồ giả. */}
          {isDemo && (
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={s.trendLabel}>Doanh thu 5 tháng</Text>
                <Text style={s.trendBadge}>+12% vs cùng kỳ</Text>
              </View>
              <MiniBarChart data={MONTHLY_TREND} />
            </View>
          )}
        </View>

        {/* ── Per-class breakdown ── */}
        <Text style={s.sectionLabel}>THEO LỚP</Text>
        <View style={s.card}>
          {classBreakdowns.map((cls, i) => (
            <View key={cls.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : {}}>
              <ClassBreakdown
                cls={`${cls.name}`}
                paidCount={cls.paidCount}
                totalCount={cls.totalCount}
                paidAmt={cls.paidAmt}
                targetAmt={cls.targetAmt}
              />
            </View>
          ))}
        </View>

        {/* ── Zalo nudge prompt ── */}
        {unpaidList.length > 0 && !sent && (
          <View style={s.zaloPrompt}>
            <View style={s.zaloPromptIcon}>
              <IconZalo size={20} color={colors.green600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.zaloPromptTitle}>{unpaidList.length} phụ huynh chưa nộp</Text>
              <Text style={s.zaloPromptSub}>Gửi Zalo nhắc nhẹ nhàng?</Text>
            </View>
            <TouchableOpacity style={s.zaloPromptBtn} onPress={() => setShowZaloModal(true)}>
              <Text style={s.zaloPromptBtnText}>Gửi nhắc</Text>
            </TouchableOpacity>
          </View>
        )}

        {sent && (
          <View style={[s.zaloPrompt, { backgroundColor: colors.green100 }]}>
            <View style={[s.zaloPromptIcon, { backgroundColor: colors.green500 }]}>
              <IconCheck size={18} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.zaloPromptTitle, { color: colors.green700 }]}>Đã đánh dấu nhắc {unpaidList.length} phụ huynh</Text>
              <Text style={[s.zaloPromptSub, { color: colors.green600 }]}>Nhớ gửi trong Zalo nhé</Text>
            </View>
          </View>
        )}

        {/* ── Recent transactions ── */}
        <Text style={s.sectionLabel}>GIAO DỊCH GẦN ĐÂY</Text>
        <View style={s.card}>
          {(() => {
            const txs = isDemo ? DEMO_TRANSACTIONS : paidList.slice(0, 5).map(d => ({
              name: d.student_name, cls: d.className, when: 'Gần đây', amt: d.amount, note: undefined,
            }));
            if (txs.length === 0) {
              return (
                <View style={s.txEmpty}>
                  <View style={s.txEmptyIcon}>
                    <IconWallet size={22} color={colors.green600} />
                  </View>
                  <Text style={s.txEmptyTitle}>Chưa có giao dịch</Text>
                  <Text style={s.txEmptySub}>
                    Khi học sinh nộp tiền, {pronoun} tick “đã thu”, giao dịch sẽ hiện ở đây.
                  </Text>
                </View>
              );
            }
            return txs.map((tx, i) => (
              <View key={i} style={[s.txRow, i > 0 && s.txDivider]}>
                <Avatar name={tx.name} size={38} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.txName}>{tx.name}</Text>
                  <Text style={s.txSub}>{tx.cls} · {tx.when}</Text>
                </View>
                {tx.note ? (
                  <Text style={s.txNote}>{tx.note}</Text>
                ) : (
                  <Text style={s.txAmt}>+{VND_FULL(tx.amt)}</Text>
                )}
              </View>
            ));
          })()}
        </View>

        {/* ── Unpaid students (quick tick) ── */}
        {unpaidList.length > 0 && (
          <>
            <Text style={s.sectionLabel}>CHƯA NỘP · {unpaidList.length} HỌC SINH</Text>
            <View style={s.card}>
              {unpaidList.map((d, i) => (
                <View key={d.student_id + d.classId} style={[s.txRow, i > 0 && s.txDivider]}>
                  <Avatar name={d.student_name} size={38} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.txName}>{d.student_name}</Text>
                    <Text style={s.txSub}>{d.className} · {VND_FULL(d.amount)}</Text>
                  </View>
                  <TouchableOpacity style={s.tickBtn} onPress={() => markPaid(d)}>
                    <Text style={s.tickBtnText}>Tick đã thu</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Zalo copy sheet */}
      {showZaloModal && (
        <ZaloCopySheet
          title={`Nhắc học phí · ${unpaidList.length} phụ huynh`}
          recipient={`${unpaidList.length} phụ huynh chưa nộp`}
          message={zaloTemplates[0].body}
          hint="nhóm lớp hoặc nhắn riêng từng phụ huynh"
          templates={zaloTemplates}
          onConfirm={() => { setSent(true); setShowZaloModal(false); }}
          onClose={() => setShowZaloModal(false)}
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
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  taxBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.green200, backgroundColor: colors.green50 },
  taxBtnText: { fontSize: 13, fontWeight: '700', color: colors.green700 },

  heroCard: {
    backgroundColor: colors.green50, marginHorizontal: 16, marginTop: 4, marginBottom: 8,
    borderRadius: 24, borderWidth: 1, borderColor: colors.green100, padding: 20,
    shadowColor: colors.green900, shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  heroBadge: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.green100 },
  heroLabel: { fontSize: 11, fontWeight: '700', color: colors.green700, letterSpacing: 0.5 },
  heroAmt: { fontSize: 34, fontWeight: '700', color: colors.green900, letterSpacing: -0.8 },
  heroSub: { fontSize: 12, color: colors.green700, fontWeight: '600' },
  heroSub2: { fontSize: 12, color: colors.coral700, fontWeight: '600' },
  heroTrack: { height: 8, borderRadius: 4, backgroundColor: 'white', overflow: 'hidden', borderWidth: 1, borderColor: colors.green100 },
  heroFill: { height: 8, borderRadius: 4, backgroundColor: colors.green500 },
  heroEncourageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  heroEncourageEmoji: { fontSize: 16 },
  heroEncourage: { flex: 1, fontSize: 13, color: colors.green700, fontWeight: '600', lineHeight: 18 },
  trendLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  trendBadge: { fontSize: 12, fontWeight: '600', color: colors.green700, backgroundColor: colors.green100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 10, marginTop: 20, marginHorizontal: 16 },
  card: {
    backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, overflow: 'hidden',
    shadowColor: '#1a3d2a', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  txEmpty: { alignItems: 'center', paddingVertical: 26, paddingHorizontal: 24 },
  txEmptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.green50, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  txEmptyTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  txEmptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },

  zaloPrompt: {
    backgroundColor: '#f0faf4', borderRadius: 18, borderWidth: 1, borderColor: colors.green100,
    marginHorizontal: 16, marginTop: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  zaloPromptIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.green50, alignItems: 'center', justifyContent: 'center' },
  zaloPromptTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  zaloPromptSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  zaloPromptBtn: { backgroundColor: colors.green500, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  zaloPromptBtnText: { fontSize: 13, fontWeight: '700', color: 'white' },

  txRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  txDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  txName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  txSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  txAmt: { fontSize: 15, fontWeight: '700', color: colors.green700 },
  txNote: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
  tickBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.green200, backgroundColor: 'white' },
  tickBtnText: { fontSize: 12, fontWeight: '600', color: colors.green700 },

  breadcrumb: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colors.green50, borderBottomWidth: 1, borderBottomColor: colors.green100 },
  breadcrumbText: { fontSize: 13, fontWeight: '600', color: colors.green700 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white', alignSelf: 'center' },
  chipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: colors.green700 },
});
