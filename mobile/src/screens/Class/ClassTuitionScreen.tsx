import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { IconZalo, IconCheck, IconDownload } from '../../components/icons';
import { getTuition, recordPayment } from '../../api/tuition';
import { exportTuitionExcel } from '../../utils/exportExcel';
import { useAuthStore, isDemoToken } from '../../store/auth';

const VND_FULL = (n: number) => n.toLocaleString('vi-VN') + 'đ';

const buildZaloTemplates = (gw: string) => {
  const Gw = gw.charAt(0).toUpperCase() + gw.slice(1);
  return [
    { tone: 'Nhẹ nhàng', body: `Chào anh/chị! ${Gw} nhắc nhẹ là tháng này con vẫn còn thiếu học phí. Anh/chị tiện thì gửi ${gw} trong tuần này nhé 🌿` },
    { tone: 'Trực tiếp', body: `Anh/chị ơi, con đang nợ học phí tháng này. Tuần này nhớ gửi cho ${gw} nhé. Cảm ơn anh/chị.` },
    { tone: 'Có chuyển khoản', body: `Chào anh/chị, học phí con tháng này. Anh/chị chuyển khoản giúp ${gw} theo số tài khoản ${gw} đã gửi nhé. Cảm ơn anh/chị! 🌿` },
  ];
};

type Item = { student_id: string; student_name: string; amount: number; paid: boolean };

const DEMO_ITEMS: Item[] = [
  { student_id: 'd1', student_name: 'Nguyễn Minh Anh', amount: 500000, paid: true },
  { student_id: 'd2', student_name: 'Trần Bảo Long', amount: 500000, paid: false },
  { student_id: 'd3', student_name: 'Lê Hoàng Phúc', amount: 500000, paid: true },
  { student_id: 'd4', student_name: 'Phạm Quỳnh Như', amount: 500000, paid: false },
  { student_id: 'd5', student_name: 'Đỗ Minh Khôi', amount: 500000, paid: true },
  { student_id: 'd6', student_name: 'Vũ Hà My', amount: 500000, paid: true },
  { student_id: 'd7', student_name: 'Bùi Nam Sơn', amount: 500000, paid: false },
];

export function ClassTuitionScreen({ route }: any) {
  const { classId, className } = route.params;
  const isDemo = isDemoToken(useAuthStore(st => st.token));
  const teacher = useAuthStore(st => st.teacher);
  const gw = teacher?.gender === 'thay' ? 'thầy' : 'cô';
  const zaloTemplates = buildZaloTemplates(gw);
  const [items, setItems] = useState<Item[]>(isDemo ? DEMO_ITEMS : []);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState(false);
  const [showZalo, setShowZalo] = useState(false);
  const [sent, setSent] = useState(false);
  const month = new Date().toISOString().slice(0, 7);
  const monthLabel = `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    setLoading(true);
    setError(false);
    getTuition(classId, month)
      .then((rows: any[]) => {
        if (!alive) return;
        setItems(rows.map(r => ({
          student_id: r.student_id,
          student_name: r.student_name,
          amount: r.amount,
          paid: r.paid,
        })));
      })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [classId, isDemo]);

  const paidList = items.filter(d => d.paid);
  const unpaidList = items.filter(d => !d.paid);
  const totalPaid = paidList.reduce((a, d) => a + d.amount, 0);
  const totalUnpaid = unpaidList.reduce((a, d) => a + d.amount, 0);
  const totalTarget = items.reduce((a, d) => a + d.amount, 0);
  const pct = totalTarget > 0 ? totalPaid / totalTarget : 0;

  const markPaid = (item: Item) => {
    // Optimistic tick
    setItems(d => d.map(x => x.student_id === item.student_id ? { ...x, paid: true } : x));
    if (isDemo) return;
    recordPayment(classId, { student_id: item.student_id, paid: true, amount: item.amount, month }).catch(() => {
      // Roll back and tell the teacher it didn't save
      setItems(d => d.map(x => x.student_id === item.student_id ? { ...x, paid: false } : x));
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

  if (error && items.length === 0) {
    return (
      <View style={[s.container, s.center]}>
        <Text style={s.emptyTitle}>Không tải được học phí</Text>
        <Text style={s.emptySub}>Kiểm tra kết nối mạng rồi mở lại màn hình.</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[s.container, s.center]}>
        <Text style={s.emptyTitle}>Chưa có học sinh</Text>
        <Text style={s.emptySub}>Thêm học sinh vào lớp để bắt đầu thu học phí.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero — số tiền là tâm điểm */}
        <View style={s.hero}>
          <View style={s.heroTopRow}>
            <Text style={s.heroLabel} numberOfLines={1}>THU HỌC PHÍ · {className} · {monthLabel}</Text>
            {items.length > 0 && (
              <TouchableOpacity
                style={s.exportBtn}
                onPress={() => exportTuitionExcel(items, className, monthLabel)}
              >
                <IconDownload size={13} color={colors.green500} />
                <Text style={s.exportBtnText}>Excel</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={s.heroAmt}>{VND_FULL(totalPaid)}</Text>
          <Text style={s.heroSub}>
            đã thu{unpaidList.length > 0 ? ` · còn thiếu ${VND_FULL(totalUnpaid)} từ ${unpaidList.length} con` : ' · đủ cả lớp 🌿'}
          </Text>
          <View style={s.track}><View style={[s.fill, { width: `${pct * 100}%` as any }]} /></View>
          <Text style={s.heroPct}>{Math.round(pct * 100)}% · {paidList.length}/{items.length} học sinh</Text>
        </View>

        {/* Unpaid section */}
        {unpaidList.length > 0 && (
          <>
            <Text style={s.sectionLabel}>CHƯA NỘP · {unpaidList.length}</Text>
            <View style={s.card}>
              {unpaidList.map((d, i) => (
                <View key={d.student_id} style={[s.row, i > 0 && s.divider]}>
                  <Avatar name={d.student_name} size={38} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.stuName}>{d.student_name}</Text>
                    <Text style={s.stuSub}>{VND_FULL(d.amount)}</Text>
                  </View>
                  <TouchableOpacity style={s.tickBtn} onPress={() => markPaid(d)}>
                    <IconCheck size={13} color="white" />
                    <Text style={s.tickBtnText}>Tick thu</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {!sent ? (
              <View style={s.zaloPrompt}>
                <View style={s.zaloIcon}><IconZalo size={18} color={colors.green600} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.zaloTitle}>{unpaidList.length} phụ huynh chưa nộp</Text>
                  <Text style={s.zaloSub}>Gửi Zalo nhắc nhẹ nhàng?</Text>
                </View>
                <TouchableOpacity style={s.zaloBtn} onPress={() => setShowZalo(true)}>
                  <Text style={s.zaloBtnText}>Gửi nhắc</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[s.zaloPrompt, { backgroundColor: colors.green100, borderColor: colors.green200 }]}>
                <View style={[s.zaloIcon, { backgroundColor: colors.green500 }]}>
                  <IconCheck size={16} color="white" />
                </View>
                <Text style={[s.zaloTitle, { color: colors.green700 }]}>Đã đánh dấu nhắc {unpaidList.length} phụ huynh — nhớ gửi trong Zalo</Text>
              </View>
            )}
          </>
        )}

        {/* Paid section */}
        {paidList.length > 0 && (
          <>
            <Text style={s.sectionLabel}>ĐÃ NỘP · {paidList.length}</Text>
            <View style={s.card}>
              {paidList.map((d, i) => (
                <View key={d.student_id} style={[s.row, i > 0 && s.divider]}>
                  <Avatar name={d.student_name} size={38} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.stuName}>{d.student_name}</Text>
                    <Text style={s.stuSub}>{VND_FULL(d.amount)}</Text>
                  </View>
                  <View style={s.paidBadge}>
                    <IconCheck size={13} color="white" />
                    <Text style={s.paidText}>Đã nộp</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {showZalo && (
        <ZaloCopySheet
          title={`Nhắc học phí · ${unpaidList.length} phụ huynh`}
          recipient={`${unpaidList.length} phụ huynh chưa nộp · ${className}`}
          message={zaloTemplates[0].body}
          hint="nhóm lớp hoặc nhắn riêng từng phụ huynh"
          templates={zaloTemplates}
          onConfirm={() => { setSent(true); setShowZalo(false); }}
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
  hero: {
    backgroundColor: colors.green500, margin: 16, borderRadius: 24,
    padding: 22, paddingTop: 18,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  heroLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.82)', letterSpacing: 0.5, flex: 1, marginRight: 8 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, backgroundColor: 'white' },
  exportBtnText: { fontSize: 11, fontWeight: '700', color: colors.green500 },
  heroAmt: { fontSize: 44, fontWeight: '800', color: 'white', letterSpacing: -1.2, lineHeight: 50 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: 4, marginBottom: 14 },
  heroPct: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 8 },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: 'white' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginHorizontal: 16, marginBottom: 10, marginTop: 20 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  stuName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  stuSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  tickBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 11, backgroundColor: colors.green500 },
  tickBtnText: { fontSize: 12, fontWeight: '700', color: 'white' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.green500, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  paidText: { fontSize: 12, fontWeight: '700', color: 'white' },
  zaloPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green100,
    borderRadius: 18, margin: 16, padding: 14,
  },
  zaloIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' },
  zaloTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  zaloSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  zaloBtn: { backgroundColor: colors.green500, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  zaloBtnText: { fontSize: 13, fontWeight: '700', color: 'white' },
});
