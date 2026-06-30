import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme';
import { getNotifConfig, putNotifPrefs, NotifConfig, NotifRule } from '../../api/notify';

const TIMES = ['06:00', '06:30', '07:00', '07:30', '08:00'];
const REPORT_TIMES = ['18:00', '19:00', '20:00', '21:00'];
const LEADS = [15, 30, 60];
const DOMS = [25, 28, 30, 1];
const WEEKDAYS = [{ l: 'T6', v: 6 }, { l: 'T7', v: 7 }, { l: 'CN', v: 7 }];
const DND_STARTS = ['21:00', '22:00', '23:00'];
const DND_ENDS = ['06:00', '07:00', '08:00'];

function Chips({ options, value, onPick, fmt }: { options: any[]; value: any; onPick: (v: any) => void; fmt?: (v: any) => string }) {
  return (
    <View style={s.chipRow}>
      {options.map(o => {
        const v = typeof o === 'object' ? o.v : o;
        const label = typeof o === 'object' ? o.l : (fmt ? fmt(o) : String(o));
        const active = value === v;
        return (
          <TouchableOpacity key={String(v) + label} style={[s.chip, active && s.chipActive]} onPress={() => onPick(v)}>
            <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function NotificationSettings() {
  const [cfg, setCfg] = useState<NotifConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifConfig().then(setCfg).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const rule = (k: string): NotifRule => cfg?.rules?.[k] || {};
  const save = (patch: Parameters<typeof putNotifPrefs>[0]) => {
    putNotifPrefs(patch).then(setCfg).catch(() => {});
  };
  const setRule = (k: string, v: NotifRule) => {
    setCfg(c => c ? { ...c, rules: { ...c.rules, [k]: { ...c.rules[k], ...v } } } : c); // optimistic
    save({ rules: { [k]: v } });
  };

  if (loading) {
    return <View style={[s.container, s.center]}><ActivityIndicator color={colors.green500} size="large" /></View>;
  }
  if (!cfg) {
    return <View style={[s.container, s.center]}><Text style={s.muted}>Không tải được cài đặt. Thử lại sau.</Text></View>;
  }

  const quiet = cfg.contact_policy?.quiet_hours || ['22:00', '07:00'];

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={s.section}>NHẮC VIỆC (bạn tự chỉnh)</Text>

      <View style={s.card}>
        <RuleRow label="⏰ Trước buổi học" sub="Nhắc trước khi tới giờ dạy"
          on={rule('class_reminder').enabled !== false}
          onToggle={v => setRule('class_reminder', { enabled: v })} />
        {rule('class_reminder').enabled !== false && (
          <Chips options={LEADS} value={rule('class_reminder').lead_minutes ?? 30}
            fmt={v => `${v} phút`} onPick={v => setRule('class_reminder', { lead_minutes: v })} />
        )}
      </View>

      <View style={s.card}>
        <RuleRow label="🌅 Tóm tắt sáng" sub="Việc cần làm trong ngày"
          on={rule('morning_summary').enabled !== false}
          onToggle={v => setRule('morning_summary', { enabled: v })} />
        {rule('morning_summary').enabled !== false && (
          <Chips options={TIMES} value={rule('morning_summary').at ?? '07:00'}
            onPick={v => setRule('morning_summary', { at: v })} />
        )}
      </View>

      <View style={s.card}>
        <RuleRow label="💰 Nhắc thu học phí" sub="Cuối tháng nhắc kiểm tra"
          on={rule('tuition_reminder').enabled !== false}
          onToggle={v => setRule('tuition_reminder', { enabled: v })} />
        {rule('tuition_reminder').enabled !== false && (
          <Chips options={DOMS} value={rule('tuition_reminder').day_of_month ?? 28}
            fmt={v => `Ngày ${v}`} onPick={v => setRule('tuition_reminder', { day_of_month: v })} />
        )}
      </View>

      <View style={s.card}>
        <RuleRow label="📊 Nhắc gửi báo cáo" sub="Tổng kết tuần cho phụ huynh"
          on={rule('report_reminder').enabled !== false}
          onToggle={v => setRule('report_reminder', { enabled: v })} />
        {rule('report_reminder').enabled !== false && (
          <Chips options={REPORT_TIMES} value={rule('report_reminder').at ?? '19:00'}
            onPick={v => setRule('report_reminder', { at: v })} />
        )}
      </View>

      <Text style={s.section}>KHÔNG LÀM PHIỀN</Text>
      <View style={s.card}>
        <Text style={s.dndLabel}>Từ</Text>
        <Chips options={DND_STARTS} value={quiet[0]} onPick={v => save({ quiet_hours: [v, quiet[1]] })} />
        <Text style={s.dndLabel}>Đến</Text>
        <Chips options={DND_ENDS} value={quiet[1]} onPick={v => save({ quiet_hours: [quiet[0], v] })} />
        <Text style={s.muted}>Không gửi thông báo trong khung giờ này.</Text>
      </View>

      <Text style={s.section}>TỪ GIEOCHỮ</Text>
      <View style={s.card}>
        <RuleRow label="📣 Tin & ưu đãi từ GieoChữ" sub="Mẹo dạy học, ưu đãi, cập nhật"
          on={cfg.marketing_opt_in}
          onToggle={v => { setCfg(c => c ? { ...c, marketing_opt_in: v } : c); save({ marketing_opt_in: v }); }} />
      </View>

      <Text style={[s.muted, { marginTop: 16, textAlign: 'center' }]}>
        Thông báo nhắc việc chạy ngay trên máy bạn — không cần mạng.
      </Text>
    </ScrollView>
  );
}

function RuleRow({ label, sub, on, onToggle }: { label: string; sub?: string; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <Switch value={on} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.green500 }} thumbColor="white" />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginTop: 18, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  rowSub: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'white' },
  chipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.green700 },
  dndLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  muted: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
});
