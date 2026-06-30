import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { colors } from '../../theme';
import { getTaxSummary, getTaxDeclaration, TaxSummary } from '../../api/tax';
import { useAuthStore } from '../../store/auth';
import { copyToClipboard } from '../../utils/clipboard';

const VND = (n: number) => n.toLocaleString('vi-VN') + 'đ';
const CUR_YEAR = new Date().getFullYear();
const YEARS = [CUR_YEAR, CUR_YEAR - 1, CUR_YEAR - 2];

export function TaxScreen() {
  const teacher = useAuthStore(s => s.teacher);
  const updateTaxProfile = useAuthStore(s => s.updateTaxProfile);

  const [year, setYear] = useState(CUR_YEAR);
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Tax-profile form
  const [taxId, setTaxId] = useState(teacher?.tax_id ?? '');
  const [legalName, setLegalName] = useState(teacher?.full_legal_name ?? '');
  const [idNumber, setIdNumber] = useState(teacher?.id_number ?? '');
  const [dob, setDob] = useState(teacher?.date_of_birth ?? '');
  const [address, setAddress] = useState(teacher?.address ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [declaration, setDeclaration] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    getTaxSummary(year)
      .then(d => { if (alive) setSummary(d); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [year]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateTaxProfile({
        tax_id: taxId.trim() || undefined,
        full_legal_name: legalName.trim() || undefined,
        id_number: idNumber.trim() || undefined,
        date_of_birth: dob.trim() || undefined,
        address: address.trim() || undefined,
      });
      Alert.alert('Đã lưu', 'Thông tin thuế đã được cập nhật.');
    } catch {
      Alert.alert('Chưa lưu được', 'Kiểm tra kết nối mạng rồi thử lại.');
    } finally {
      setSavingProfile(false);
    }
  };

  const generateDeclaration = async () => {
    if (!taxId.trim()) {
      Alert.alert('Thiếu MST', 'Vui lòng nhập Mã số thuế và bấm Lưu trước khi tạo tờ khai.');
      return;
    }
    setGenLoading(true);
    try {
      const d = await getTaxDeclaration(year);
      setDeclaration(d.declaration_text);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? 'Không tạo được tờ khai. Thử lại.';
      Alert.alert('Lỗi', String(msg));
    } finally {
      setGenLoading(false);
    }
  };

  const copyDeclaration = async () => {
    if (!declaration) return;
    const ok = await copyToClipboard(declaration);
    Alert.alert(
      ok ? 'Đã sao chép' : 'Chưa sao chép được',
      ok ? 'Tờ khai đã được sao chép. Bạn có thể dán vào email hoặc thuedientu.gdt.gov.vn.'
         : 'Bạn có thể chụp màn hình nội dung bên dưới.',
    );
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Year picker */}
      <View style={s.yearRow}>
        {YEARS.map(y => (
          <TouchableOpacity
            key={y}
            style={[s.yearChip, year === y && s.yearChipActive]}
            onPress={() => setYear(y)}
          >
            <Text style={[s.yearChipText, year === y && s.yearChipTextActive]}>Năm {y}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.green500} size="large" /></View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>Không tải được dữ liệu thuế</Text>
          <Text style={s.emptySub}>Kiểm tra kết nối mạng rồi thử lại.</Text>
        </View>
      ) : summary && (
        <>
          <View style={[s.hero, summary.status === 'taxable' && s.heroTaxable]}>
            <Text style={s.heroLabel}>
              {summary.status === 'taxable' ? 'THUẾ TNCN CẦN NỘP' : 'TỔNG THU NĂM ' + year}
            </Text>
            <Text style={s.heroAmt}>
              {summary.status === 'taxable' ? VND(summary.tax_owed) : VND(summary.total_collected)}
            </Text>
            <Text style={s.heroSub}>{summary.summary_text}</Text>
          </View>

          <View style={s.statRow}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Tổng doanh thu</Text>
              <Text style={s.statValue}>{VND(summary.total_collected)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Ngưỡng miễn thuế</Text>
              <Text style={s.statValue}>{VND(summary.threshold)}</Text>
            </View>
          </View>

          {summary.by_class.length > 0 && (
            <>
              <Text style={s.sectionLabel}>THEO LỚP</Text>
              <View style={s.card}>
                {summary.by_class.map((c, i) => (
                  <View key={c.class_name + i} style={[s.lineRow, i > 0 && s.divider]}>
                    <Text style={s.lineName}>{c.class_name}</Text>
                    <Text style={s.lineAmt}>{VND(c.amount)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {summary.by_month.length > 0 && (
            <>
              <Text style={s.sectionLabel}>THEO THÁNG</Text>
              <View style={s.card}>
                {summary.by_month.map((m, i) => (
                  <View key={m.month} style={[s.lineRow, i > 0 && s.divider]}>
                    <Text style={s.lineName}>{m.month}</Text>
                    <Text style={s.lineAmt}>{VND(m.amount)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}

      {/* Tax profile form */}
      <Text style={s.sectionLabel}>THÔNG TIN KHAI THUẾ</Text>
      <View style={s.card}>
        <Field label="Mã số thuế (MST)" value={taxId} onChange={setTaxId} placeholder="VD: 0123456789" keyboardType="number-pad" />
        <Field label="Họ tên đầy đủ (theo CCCD)" value={legalName} onChange={setLegalName} placeholder="Nguyễn Thị Mai" />
        <Field label="Số CCCD/CMND" value={idNumber} onChange={setIdNumber} placeholder="012345678901" keyboardType="number-pad" />
        <Field label="Ngày sinh (Ngày/Tháng/Năm)" value={dob} onChange={setDob} placeholder="15/01/1990" keyboardType="numbers-and-punctuation" />
        <Field label="Địa chỉ" value={address} onChange={setAddress} placeholder="Số nhà, đường, quận, tỉnh/TP" last />
      </View>
      <TouchableOpacity style={[s.btn, savingProfile && s.btnDisabled]} onPress={saveProfile} disabled={savingProfile}>
        {savingProfile ? <ActivityIndicator color="white" /> : <Text style={s.btnText}>Lưu thông tin thuế</Text>}
      </TouchableOpacity>

      {/* Declaration */}
      <Text style={s.sectionLabel}>TỜ KHAI 09/KK-TNCN</Text>
      <TouchableOpacity style={[s.btnOutline, genLoading && s.btnDisabled]} onPress={generateDeclaration} disabled={genLoading}>
        {genLoading ? <ActivityIndicator color={colors.green700} /> : <Text style={s.btnOutlineText}>Tạo tờ khai năm {year}</Text>}
      </TouchableOpacity>

      {declaration && (
        <View style={s.declarationBox}>
          <Text style={s.declarationNote}>
            Đây là bản nháp để tham khảo. GieoChữ không tự nộp thay bạn — bạn nộp tại
            thuedientu.gdt.gov.vn hoặc tại chi cục thuế. Hạn nộp thường là cuối tháng 3 năm sau.
          </Text>
          <Text style={s.declarationText}>{declaration}</Text>
          <TouchableOpacity style={s.copyBtn} onPress={copyDeclaration}>
            <Text style={s.copyBtnText}>Sao chép tờ khai</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, last }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; last?: boolean;
}) {
  return (
    <View style={[s.field, !last && s.divider]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  yearRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 4 },
  yearChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white' },
  yearChipActive: { backgroundColor: colors.green500, borderColor: colors.green500 },
  yearChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  yearChipTextActive: { color: 'white' },

  hero: { backgroundColor: 'white', margin: 16, marginTop: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.green200, padding: 18 },
  heroTaxable: { borderColor: colors.coral500, backgroundColor: colors.coral50 },
  heroLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginBottom: 6 },
  heroAmt: { fontSize: 30, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.6, marginBottom: 6 },
  heroSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  statRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16 },
  statBox: { flex: 1, backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginHorizontal: 16, marginBottom: 10, marginTop: 22 },
  card: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, overflow: 'hidden' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  lineName: { fontSize: 14, color: colors.textPrimary },
  lineAmt: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },

  field: { padding: 14 },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  fieldInput: { fontSize: 15, color: colors.textPrimary, padding: 0 },

  btn: { backgroundColor: colors.green500, marginHorizontal: 16, marginTop: 12, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  btnOutline: { marginHorizontal: 16, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.green500, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
  btnOutlineText: { color: colors.green700, fontSize: 15, fontWeight: '700' },

  declarationBox: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, margin: 16, padding: 16 },
  declarationNote: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 12, backgroundColor: colors.honey100, padding: 10, borderRadius: 10 },
  declarationText: { fontSize: 13, color: colors.textPrimary, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  copyBtn: { marginTop: 14, backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green200, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  copyBtnText: { color: colors.green700, fontWeight: '600', fontSize: 13 },
});
