import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ZaloCopySheet } from '../../components/ui/ZaloCopySheet';
import { IconZalo, IconCheck, IconDownload } from '../../components/icons';
import { getTuition, recordPayment } from '../../api/tuition';
import { exportTuitionExcel } from '../../utils/exportExcel';

const VND_FULL = (n: number) => n.toLocaleString('vi-VN') + 'đ';
const VND = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + 'tr' : (n / 1000).toFixed(0) + 'k';

const ZALO_TEMPLATES = [
  { tone: 'Nhẹ nhàng', body: 'Chào anh/chị! Cô nhắc nhẹ là tháng này con vẫn còn thiếu học phí. Anh/chị tiện thì gửi cô trong tuần này nhé 🌿' },
  { tone: 'Trực tiếp', body: 'Anh/chị ơi, con đang nợ học phí tháng này. Tuần này nhớ gửi cho cô nhé. Cảm ơn anh/chị.' },
  { tone: 'Có chuyển khoản', body: 'Chào anh/chị, học phí con tháng này. Anh/chị có thể chuyển khoản: Vietcombank · 0123 456 789 · Ng. T. Mai. Cảm ơn!' },
];

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
  const [items, setItems] = useState<Item[]>(DEMO_ITEMS);
  const [isDemo, setIsDemo] = useState(true);
  const [showZalo, setShowZalo] = useState(false);
  const [sent, setSent] = useState(false);
  const month = new Date().toISOString().slice(0, 7);
  const monthLabel = `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

  useEffect(() => {
    getTuition(classId, month)
      .then((rows: any[]) => {
        if (rows.length > 0) {
          setItems(rows.map(r => ({
            student_id: r.student_id,
            student_name: r.student_name,
            amount: r.amount,
            paid: r.paid,
          })));
          setIsDemo(false);
        }
      })
      .catch(() => {});
  }, [classId]);

  const paidList = items.filter(d => d.paid);
  const unpaidList = items.filter(d => !d.paid);
  const totalPaid = paidList.reduce((a, d) => a + d.amount, 0);
  const totalUnpaid = unpaidList.reduce((a, d) => a + d.amount, 0);
  const totalTarget = items.reduce((a, d) => a + d.amount, 0);
  const pct = totalTarget > 0 ? totalPaid / totalTarget : 0;

  const markPaid = (item: Item) => {
    setItems(d => d.map(x => x.student_id === item.student_id ? { ...x, paid: true } : x));
    if (!isDemo) {
      recordPayment(classId, { student_id: item.student_id, paid: true, amount: item.amount }).catch(() => {});
    }
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero summary */}
        <View style={s.hero}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={s.heroLabel}>ĐÃ THU · {monthLabel}</Text>
            {items.length > 0 && (
              <TouchableOpacity
                style={s.exportBtn}
                onPress={() => exportTuitionExcel(items, className, monthLabel)}
              >
                <IconDownload size={13} color={colors.green700} />
                <Text style={s.exportBtnText}>Xuất Excel</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={s.heroAmt}>{VND_FULL(totalPaid)}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 }}>
            <Text style={s.heroSub}>{Math.round(pct * 100)}% · {paidList.length}/{items.length} học sinh</Text>
            <Text style={s.heroSubRed}>Còn {VND(totalUnpaid)}</Text>
          </View>
          <View style={s.track}><View style={[s.fill, { width: `${pct * 100}%` as any }]} /></View>
        </View>

        {/* Unpaid section */}
        {unpaidList.length > 0 && (
          <>
            <Text style={s.sectionLabel}>CHƯA NỘP · {unpaidList.length} HỌC SINH</Text>
            <View style={s.card}>
              {unpaidList.map((d, i) => (
                <View key={d.student_id} style={[s.row, i > 0 && s.divider]}>
                  <Avatar name={d.student_name} size={38} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.stuName}>{d.student_name}</Text>
                    <Text style={s.stuSub}>{VND_FULL(d.amount)}</Text>
                  </View>
                  <TouchableOpacity style={s.tickBtn} onPress={() => markPaid(d)}>
                    <Text style={s.tickBtnText}>Tick đã thu</Text>
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
                <Text style={[s.zaloTitle, { color: colors.green700 }]}>Đã gửi {unpaidList.length} tin Zalo</Text>
              </View>
            )}
          </>
        )}

        {/* Paid section */}
        {paidList.length > 0 && (
          <>
            <Text style={s.sectionLabel}>ĐÃ NỘP · {paidList.length} HỌC SINH</Text>
            <View style={s.card}>
              {paidList.map((d, i) => (
                <View key={d.student_id} style={[s.row, i > 0 && s.divider]}>
                  <Avatar name={d.student_name} size={38} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.stuName}>{d.student_name}</Text>
                    <Text style={s.stuSub}>{VND_FULL(d.amount)}</Text>
                  </View>
                  <View style={s.paidBadge}>
                    <IconCheck size={13} color={colors.green700} />
                    <Text style={s.paidText}>Đã thu</Text>
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
          message={ZALO_TEMPLATES[0].body}
          hint="nhóm lớp hoặc nhắn riêng từng phụ huynh"
          templates={ZALO_TEMPLATES}
          onConfirm={() => { setSent(true); setShowZalo(false); }}
          onClose={() => setShowZalo(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: 'white', margin: 16, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, padding: 18,
  },
  heroLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 4, flex: 1 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.green200, backgroundColor: colors.green50 },
  exportBtnText: { fontSize: 11, fontWeight: '600', color: colors.green700 },
  heroAmt: { fontSize: 32, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.8 },
  heroSub: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  heroSubRed: { fontSize: 12, color: colors.coral700, fontWeight: '600' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.green500 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginHorizontal: 16, marginBottom: 10, marginTop: 20 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  stuName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  stuSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  tickBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.green200, backgroundColor: 'white' },
  tickBtnText: { fontSize: 12, fontWeight: '600', color: colors.green700 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.green100, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 },
  paidText: { fontSize: 12, fontWeight: '600', color: colors.green700 },
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
