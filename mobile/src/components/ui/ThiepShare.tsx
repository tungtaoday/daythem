import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Image, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { colors } from '../../theme';
import { IconZalo } from '../icons';
import { trackEvent } from '../../api/events';
import { Mascot } from './mascot';

// ── Mầm cây (logo) ──
// FIX CRASH: bản cũ render thẻ 'svg' kiểu WEB ('svg' as any) — component đó không
// tồn tại trên Android native → app văng NGAY khi mở thiệp. Dùng react-native-svg
// (chạy cả native lẫn web) để giữ đúng brand mark.
import Svg, { Circle, Path } from 'react-native-svg';

function Sprout({ size = 30, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Circle cx={22} cy={20} r={2.4} fill={color} />
      <Circle cx={34} cy={14} r={2.4} fill={color} opacity={0.85} />
      <Circle cx={44} cy={22} r={2.4} fill={color} opacity={0.7} />
      <Path d="M8 50 Q32 40 56 50 L56 56 Q32 52 8 56 Z" fill={color} opacity={0.3} />
      <Path d="M32 52 L32 34" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M32 40 C26 40 21 36 21 29 C27 29 32 33 32 40 Z" fill={color} />
      <Path d="M32 36 C38 36 43 31 43 25 C37 25 32 30 32 36 Z" fill={color} opacity={0.85} />
    </Svg>
  );
}

// ── Sheet: hiển thị 1 tấm thiệp + nút chia sẻ (chụp View thành PNG) ──
export function ThiepShareSheet({ children, onClose, sub, noteValue, onNoteChange, onSaveNote, noteSaved }: {
  children: React.ReactNode;
  onClose: () => void;
  /** 1 câu giải thích thiệp là gì / gửi lúc nào (GV góp ý "không rõ ý nghĩa"). */
  sub?: string;
  /** Lời nhắn trên thiệp — GV sửa được, xem trước ngay trên thiệp. */
  noteValue?: string;
  onNoteChange?: (v: string) => void;
  onSaveNote?: () => void;
  noteSaved?: boolean;
}) {
  const shotRef = useRef<ViewShot>(null);
  const [busy, setBusy] = useState(false);

  const share = async () => {
    try {
      setBusy(true);
      // @ts-ignore capture tồn tại trên instance ViewShot
      const uri = await shotRef.current?.capture?.();
      if (!uri) throw new Error('no uri');
      let shareUri = uri;
      if (Platform.OS !== 'web') {
        // FIX CRASH Android: view-shot lưu tmpfile vào EXTERNAL cache — FileProvider
        // của expo-sharing không phủ đường dẫn đó → app văng khi mở share sheet.
        // Copy ảnh vào internal cache (được FileProvider phủ) rồi mới chia sẻ.
        // Lưu ý SDK 54: PHẢI import 'expo-file-system/legacy' (bản thường ném lỗi runtime).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FS = (await import('expo-file-system/legacy')) as any;
        shareUri = FS.cacheDirectory + `gieochu-thiep-${Date.now()}.png`;
        await FS.copyAsync({ from: uri, to: shareUri });
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, { mimeType: 'image/png', dialogTitle: 'Gửi qua Zalo' });
        trackEvent('thiep_shared');
      } else {
        Alert.alert('Đã tạo ảnh', 'Thiết bị chưa hỗ trợ chia sẻ trực tiếp.');
      }
    } catch {
      Alert.alert('Chưa tạo được ảnh', Platform.OS === 'web' ? 'Thử trên điện thoại nhé.' : 'Thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity style={s.wrap} activeOpacity={1} onPress={() => {}}>
        {sub ? <Text style={s.subText}>{sub}</Text> : null}
        <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }}>
          {children}
        </ViewShot>

        {/* Sửa lời nhắn — xem trước ngay trên thiệp (GV toàn quyền nội dung) */}
        {onNoteChange && (
          <View style={s.noteEdit}>
            <View style={s.noteEditHead}>
              <Text style={s.noteEditLabel}>LỜI NHẮN TRÊN THIỆP · sửa tuỳ ý</Text>
              {onSaveNote && (
                <TouchableOpacity onPress={onSaveNote} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.noteSaveLink}>{noteSaved ? '✓ Đã lưu mẫu' : 'Lưu làm mẫu'}</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={s.noteInput}
              value={noteValue}
              onChangeText={onNoteChange}
              multiline
              placeholder="Lời nhắn của cô gửi phụ huynh..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <TouchableOpacity style={s.shareBtn} onPress={share} disabled={busy} activeOpacity={0.85}>
          {busy ? <ActivityIndicator color="#fff" /> : (
            <><IconZalo size={18} color="#fff" /><Text style={s.shareText}>Chia sẻ cho phụ huynh</Text></>
          )}
        </TouchableOpacity>
        <Text style={s.hint}>Ảnh sẽ mở bảng chia sẻ → chọn Zalo → gửi</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Thiệp báo cáo học sinh (tuần) ──
export function ReportThiep({ name, meta, attendancePct, present, absent, paid, note, teacher, eyebrow = 'BÁO CÁO HỌC TẬP' }: {
  name: string; meta?: string; attendancePct: number | null; present: number; absent: number;
  paid?: boolean | null; note?: string | null; teacher?: string; eyebrow?: string;
}) {
  return (
    <View style={t.card}>
      <LinearGradient colors={['#55b083', '#2f6849']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={t.head}>
        <View style={t.headTop}>
          <Sprout size={22} />
          <Text style={t.brand}>GieoChữ</Text>
        </View>
        <Text style={t.eyebrow}>{eyebrow}</Text>
        <Text style={t.name}>{name}</Text>
        {meta ? <Text style={t.meta}>{meta}</Text> : null}
      </LinearGradient>

      <View style={t.body}>
        <View style={t.statRow}>
          <Stat big={attendancePct != null ? `${attendancePct}%` : '–'} label="Chuyên cần" tone="green" />
          <Stat big={`${present}`} label="Có mặt" />
          <Stat big={`${absent}`} label="Vắng" tone={absent > 0 ? 'coral' : undefined} />
        </View>
        {paid != null && (
          <View style={[t.feePill, { backgroundColor: paid ? colors.green50 : colors.coral50 }]}>
            <Text style={[t.feeText, { color: paid ? colors.green700 : colors.coral700 }]}>
              {paid ? '✓ Học phí tháng này: đã nộp' : '• Học phí tháng này: chưa nộp'}
            </Text>
          </View>
        )}
        <View style={t.noteRow}>
          {/* Mascot Mầm Chữ — chuyên cần cao thì ăn mừng, còn lại cúi chào cảm ơn */}
          <Image
            source={attendancePct != null && attendancePct >= 90 ? Mascot.hoanThanh : Mascot.camOn}
            style={t.mascot}
            resizeMode="contain"
            accessible={false}
          />
          <Text style={[t.note, { flex: 1, textAlign: 'left' }]}>
            {note?.trim()
              ? note.trim()
              : (attendancePct != null && attendancePct >= 90
                  ? 'Con đi học đều và chăm chỉ tuần này. Cảm ơn anh/chị đã đồng hành cùng con 🌿'
                  : 'Cảm ơn anh/chị đã đồng hành. Mong con cố gắng đều hơn ở tuần tới nhé 🌿')}
          </Text>
        </View>
        <Text style={t.foot}>{teacher ? `${teacher} · ` : ''}Tạo bằng GieoChữ 🌿 · gieochu.vn</Text>
      </View>
    </View>
  );
}

// ── Thiệp chốt sổ tháng ──
export function WrapThiep({ monthLabel, collected, sessions, attendancePct, students, teacher }: {
  monthLabel: string; collected: number; sessions: number; attendancePct: number | null; students: number; teacher?: string;
}) {
  const vnd = collected.toLocaleString('vi-VN') + 'đ';
  return (
    <View style={t.card}>
      <LinearGradient colors={['#e9b84d', '#c8902a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={t.head}>
        <View style={t.headTop}><Sprout size={22} /><Text style={t.brand}>GieoChữ</Text></View>
        <Text style={t.eyebrow}>CHỐT SỔ {monthLabel.toUpperCase()}</Text>
        <Text style={t.name}>{vnd}</Text>
        <Text style={t.meta}>đã thu trong tháng</Text>
      </LinearGradient>
      <View style={t.body}>
        <View style={t.statRow}>
          <Stat big={`${sessions}`} label="Buổi dạy" />
          <Stat big={attendancePct != null ? `${attendancePct}%` : '–'} label="Chuyên cần" tone="green" />
          <Stat big={`${students}`} label="Học sinh" />
        </View>
        <View style={t.noteRow}>
          <Image source={Mascot.hoanThanh} style={t.mascot} resizeMode="contain" accessible={false} />
          <Text style={[t.note, { flex: 1, textAlign: 'left' }]}>Một tháng chăm chỉ! Cảm ơn thầy cô đã gieo chữ mỗi ngày 🌿</Text>
        </View>
        <Text style={t.foot}>{teacher ? `${teacher} · ` : ''}Tạo bằng GieoChữ 🌿 · gieochu.vn</Text>
      </View>
    </View>
  );
}

function Stat({ big, label, tone }: { big: string; label: string; tone?: 'green' | 'coral' }) {
  const color = tone === 'green' ? colors.green600 : tone === 'coral' ? colors.coral700 : colors.textPrimary;
  return (
    <View style={t.stat}>
      <Text style={[t.statBig, { color }]}>{big}</Text>
      <Text style={t.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,30,25,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 } as any,
  wrap: { alignItems: 'center' },
  subText: { color: 'rgba(255,255,255,0.92)', fontSize: 13.5, lineHeight: 19, textAlign: 'center', marginBottom: 12, maxWidth: 320 },
  noteEdit: { width: 320, maxWidth: '100%' as any, marginTop: 12 },
  noteEditHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteEditLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  noteSaveLink: { color: '#a5e8c3', fontSize: 13, fontWeight: '700' },
  noteInput: { backgroundColor: 'white', borderRadius: 12, padding: 12, fontSize: 14, color: colors.textPrimary, minHeight: 64, textAlignVertical: 'top' },
  shareBtn: { marginTop: 18, height: 52, borderRadius: 14, backgroundColor: '#3a7dd3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 28 },
  shareText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 10, textAlign: 'center' },
});

const t = StyleSheet.create({
  card: { width: 320, borderRadius: 24, backgroundColor: '#fff', overflow: 'hidden' },
  head: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22 },
  headTop: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  brand: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  eyebrow: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  name: { color: '#fff', fontSize: 27, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 },
  meta: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', marginTop: 3 },
  body: { padding: 22 },
  statRow: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 16, paddingVertical: 14, marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statBig: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 3 },
  feePill: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14, alignItems: 'center' },
  feeText: { fontSize: 13, fontWeight: '700' },
  note: { fontSize: 14, lineHeight: 21, color: colors.textPrimary, marginBottom: 16 },
  // 13px + đậm hơn: phụ huynh (khách hàng tương lai) phải đọc được nơi tải app.
  foot: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  mascot: { width: 64, height: 64, borderRadius: 16 },
});
