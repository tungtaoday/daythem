import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { BackButton } from '../../components/ui/BackButton';
import { useAuthStore, Gender } from '../../store/auth';
import { useClassesStore } from '../../store/classes';

type SetupStep = 'profile' | 'class' | 'done';

const SUBJECTS = ['Toán', 'Văn', 'Anh', 'Lý', 'Hoá', 'Sinh', 'Sử', 'Địa', 'Khác'];
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const PLACES = ['Tại nhà', 'Zoom', 'Quán cà phê', 'Khác'];
const FEE_PRESETS = [300000, 400000, 500000, 600000, 800000, 1000000];
const DURATIONS = [
  { label: '60p', value: 60 },
  { label: '1h30', value: 90 },
  { label: '2h', value: 120 },
  { label: '2h30', value: 150 },
];
const TIME_PRESETS = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

export function SetupScreen() {
  const [step, setStep] = useState<SetupStep>('profile');
  const [gender, setGender] = useState<Gender>('co');
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<number[]>([]);

  const [className, setClassName] = useState('');
  const [fee, setFee] = useState(500000);
  const [days, setDays] = useState<number[]>([3]);
  const [time, setTime] = useState('18:30');
  const [duration, setDuration] = useState(90);
  const [place, setPlace] = useState('Tại nhà');

  const { updateProfile, isLoading } = useAuthStore();
  const { createClass } = useClassesStore();

  const stepNum = step === 'profile' ? 1 : step === 'class' ? 2 : 3;

  const goToClass = () => {
    const suggested = subjects.length > 0 && grades.length > 0
      ? `${subjects[0]} · Lớp ${grades[0]}`
      : '';
    setClassName(suggested);
    setStep('class');
  };

  const handleEnter = async () => {
    if (className.trim()) {
      createClass({
        name: className.trim(),
        subject: subjects[0] || 'Toán',
        grade: String(grades[0] || 9),
        default_fee: fee,
        fee_type: 'month',
        color: 'green',
        schedule: { days, day: days[0], start_time: time, duration, location: place },
      }).catch(() => {});
    }
    await updateProfile(name.trim(), gender);
  };

  return (
    <View style={s.root}>
      <View style={s.progressRow}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[s.progressSeg, i <= stepNum && s.progressSegActive]} />
        ))}
      </View>

      {step === 'profile' && (
        <ProfileStep
          gender={gender} setGender={setGender}
          name={name} setName={setName}
          subjects={subjects} setSubjects={setSubjects}
          grades={grades} setGrades={setGrades}
          onNext={goToClass}
        />
      )}
      {step === 'class' && (
        <FirstClassStep
          gender={gender}
          className={className} setClassName={setClassName}
          fee={fee} setFee={setFee}
          days={days} setDays={setDays}
          time={time} setTime={setTime}
          duration={duration} setDuration={setDuration}
          place={place} setPlace={setPlace}
          onBack={() => setStep('profile')}
          onNext={() => setStep('done')}
        />
      )}
      {step === 'done' && (
        <DoneStep
          name={name} gender={gender}
          className={className} fee={fee}
          days={days} time={time} place={place}
          isLoading={isLoading}
          onEnter={handleEnter}
        />
      )}
    </View>
  );
}

// ─── Profile Step ─────────────────────────────────────────────────────────────
function ProfileStep({ gender, setGender, name, setName, subjects, setSubjects, grades, setGrades, onNext }: any) {
  const insets = useSafeAreaInsets();
  const genderWord = gender === 'co' ? 'Cô' : 'Thầy';
  const placeholder = gender === 'co' ? 'Ví dụ: Lan, Hương, Mai...' : 'Ví dụ: Minh, Hùng, Tuấn...';
  const valid = name.trim().length > 0 && subjects.length > 0 && grades.length > 0;

  const toggleSubject = (sub: string) =>
    setSubjects((p: string[]) => p.includes(sub) ? p.filter((x: string) => x !== sub) : [...p, sub]);
  const toggleGrade = (g: number) =>
    setGrades((p: number[]) => p.includes(g) ? p.filter((x: number) => x !== g) : [...p, g]);

  const gradeRows = [GRADES.slice(0, 6), GRADES.slice(6, 12)];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.emoji}>👋</Text>
        <Text style={s.title}>Chào mừng đến GieoChữ!</Text>
        <Text style={s.sub}>Cho chúng tôi biết thêm về bạn.</Text>

        <Text style={s.sectionLabel}>BẠN LÀ</Text>
        <View style={s.genderRow}>
          {(['co', 'thay'] as Gender[]).map(g => (
            <TouchableOpacity
              key={g}
              style={[s.genderChip, gender === g && s.genderChipActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[s.genderChipText, gender === g && s.genderChipTextActive]}>
                {g === 'co' ? 'Cô giáo' : 'Thầy giáo'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>
          {gender === 'co' ? 'CÔ TÊN GÌ Ạ?' : 'THẦY TÊN GÌ Ạ?'}
        </Text>
        <TextInput
          style={s.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>MÔN {genderWord.toUpperCase()} DẠY</Text>
        <View style={s.chipWrap}>
          {SUBJECTS.map(sub => (
            <TouchableOpacity
              key={sub}
              style={[s.chip, subjects.includes(sub) && s.chipActive]}
              onPress={() => toggleSubject(sub)}
            >
              <Text style={[s.chipText, subjects.includes(sub) && s.chipTextActive]}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>KHỐI {genderWord.toUpperCase()} DẠY</Text>
        <Text style={s.sectionHint}>Có thể chọn nhiều</Text>
        <View style={{ gap: 6 }}>
          {gradeRows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 6 }}>
              {row.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[s.gradeBtn, grades.includes(g) && s.gradeBtnActive]}
                  onPress={() => toggleGrade(g)}
                >
                  <Text style={[s.gradeBtnText, grades.includes(g) && s.gradeBtnTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom + 12, 40) }]}>
        <TouchableOpacity style={[s.btn, !valid && s.btnDisabled]} onPress={onNext} disabled={!valid}>
          <Text style={s.btnText}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── First Class Step ─────────────────────────────────────────────────────────
function FirstClassStep({ gender, className, setClassName, fee, setFee, days, setDays, time, setTime, duration, setDuration, place, setPlace, onBack, onNext }: any) {
  const insets = useSafeAreaInsets();
  const pronoun = gender === 'co' ? 'cô' : 'thầy';

  const toggleDay = (value: number) =>
    setDays((prev: number[]) =>
      prev.includes(value) ? prev.filter((x: number) => x !== value) : [...prev, value]
    );

  return (
    <View style={{ flex: 1 }}>
      <BackButton
        variant="boxed"
        onPress={onBack}
        style={{ marginLeft: spacing.lg, marginTop: spacing.sm, marginBottom: 4 }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Tạo lớp đầu của {pronoun}</Text>
        <Text style={s.sub}>Tạo nhanh 1 lớp để bắt đầu. Có thể thêm lớp khác sau.</Text>

        <Text style={s.sectionLabel}>TÊN LỚP</Text>
        <TextInput style={s.input} value={className} onChangeText={setClassName} />

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>LỊCH HỌC</Text>
        <Text style={s.sectionHint}>Ngày học trong tuần (chọn nhiều được)</Text>
        <View style={s.dayRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              style={[s.dayBtn, days.includes(i + 1) && s.dayBtnActive]}
              onPress={() => toggleDay(i + 1)}
            >
              <Text style={[s.dayBtnText, days.includes(i + 1) && s.dayBtnTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.sectionHint, { marginTop: 14 }]}>Giờ bắt đầu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 2 }}>
            {TIME_PRESETS.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.chip, time === t && s.chipActive]}
                onPress={() => setTime(t)}
              >
                <Text style={[s.chipText, time === t && s.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={[s.sectionHint, { marginTop: 14 }]}>Thời lượng</Text>
        <View style={s.chipWrap}>
          {DURATIONS.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[s.chip, duration === d.value && s.chipActive]}
              onPress={() => setDuration(d.value)}
            >
              <Text style={[s.chipText, duration === d.value && s.chipTextActive]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>ĐỊA ĐIỂM</Text>
        <View style={s.chipWrap}>
          {PLACES.map(p => (
            <TouchableOpacity
              key={p}
              style={[s.chip, place === p && s.chipActive]}
              onPress={() => setPlace(p)}
            >
              <Text style={[s.chipText, place === p && s.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>HỌC PHÍ MẶC ĐỊNH</Text>
        <Text style={s.sectionHint}>Áp dụng cho cả lớp, có thể chỉnh riêng từng học sinh sau.</Text>
        <View style={s.chipWrap}>
          {FEE_PRESETS.map(p => (
            <TouchableOpacity
              key={p}
              style={[s.chip, fee === p && s.chipActive]}
              onPress={() => setFee(p)}
            >
              <Text style={[s.chipText, fee === p && s.chipTextActive]}>
                {(p / 1000).toFixed(0)}k/th
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.customFeeRow}>
          <Text style={s.customFeeLabel}>Hoặc nhập:</Text>
          <TextInput
            style={s.customFeeInput}
            keyboardType="number-pad"
            value={FEE_PRESETS.includes(fee) ? '' : String(Math.round(fee / 1000))}
            onChangeText={t => setFee((parseInt(t.replace(/\D/g, ''), 10) || 0) * 1000)}
            placeholder="vd 450"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={s.customFeeUnit}>k/tháng</Text>
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom + 12, 40) }]}>
        <TouchableOpacity
          style={[s.btn, (!className.trim() || days.length === 0) && s.btnDisabled]}
          onPress={onNext}
          disabled={!className.trim() || days.length === 0}
        >
          <Text style={s.btnText}>Tạo lớp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Done Step ────────────────────────────────────────────────────────────────
function DoneStep({ name, gender, className, fee, days, time, place, isLoading, onEnter }: any) {
  const insets = useSafeAreaInsets();
  const pronoun = gender === 'co' ? 'cô' : 'thầy';
  const firstName = name.trim().split(' ').slice(-1)[0];
  const dayLabel = (days as number[]).map(d => DAYS[d - 1] ?? '').filter(Boolean).join(', ');

  return (
    <View style={[s.doneWrap, { paddingBottom: spacing.lg + insets.bottom }]}>
      <View style={s.doneIcon}>
        <Text style={{ fontSize: 44 }}>🌿</Text>
      </View>
      <Text style={s.doneTitle}>Sẵn sàng rồi!</Text>
      <Text style={s.doneSub}>
        Chào mừng {pronoun} {firstName} đến với GieoChữ
      </Text>

      <View style={s.summaryCard}>
        <View style={s.summaryRow}>
          <Text style={s.summaryEmoji}>📚</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.summaryName}>{className}</Text>
            <Text style={s.summarySub}>{dayLabel} · {time} · {place}</Text>
          </View>
        </View>
        <View style={[s.summaryRow, s.summaryDivider]}>
          <Text style={s.summaryEmoji}>💰</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.summaryName}>{fee.toLocaleString('vi-VN')}đ/tháng</Text>
            <Text style={s.summarySub}>Chỉnh riêng từng học sinh trong Cài đặt lớp</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={s.btn} onPress={onEnter} disabled={isLoading}>
        {isLoading
          ? <ActivityIndicator color="white" />
          : <Text style={s.btnText}>Vào app 🌿</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  progressRow: {
    flexDirection: 'row', gap: 4,
    paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: 8,
  },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressSegActive: { backgroundColor: colors.green500 },

  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: 16, paddingBottom: 40 },

  emoji: { fontSize: 48, marginBottom: 14 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, lineHeight: 30, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3, marginBottom: 10 },
  sectionHint: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  customFeeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  customFeeLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  customFeeInput: { flex: 1, height: 44, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, fontSize: 15, color: colors.textPrimary, backgroundColor: 'white' },
  customFeeUnit: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  input: {
    height: 52, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    fontSize: 16, fontWeight: '500', color: colors.textPrimary, backgroundColor: 'white',
  },

  genderRow: { flexDirection: 'row', gap: 10 },
  genderChip: { flex: 1, height: 52, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  genderChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  genderChipText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  genderChipTextActive: { color: colors.green700 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'white' },
  chipActive: { borderColor: colors.green500, backgroundColor: colors.green500 },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: 'white' },

  gradeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  gradeBtnActive: { borderColor: colors.green500, backgroundColor: colors.green500 },
  gradeBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  gradeBtnTextActive: { color: 'white' },

  dayRow: { flexDirection: 'row', gap: 4 },
  dayBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'white', alignItems: 'center' },
  dayBtnActive: { borderColor: colors.green500, backgroundColor: colors.green500 },
  dayBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  dayBtnTextActive: { color: 'white' },

  footer: { padding: spacing.lg, paddingBottom: 40 },
  btn: { height: 56, borderRadius: radius.lg, backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.45 },

  doneWrap: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  doneIcon: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: colors.green500, alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
    shadowColor: colors.green500, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  doneTitle: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  doneSub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  summaryCard: { width: '100%', backgroundColor: 'white', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: 28 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryDivider: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 },
  summaryEmoji: { fontSize: 20, lineHeight: 24 },
  summaryName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  summarySub: { fontSize: 12, color: colors.textSecondary },
});
