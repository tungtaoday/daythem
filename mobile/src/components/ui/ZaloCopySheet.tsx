import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors } from '../../theme';
import { IconZalo, IconCheck } from '../icons';
import { copyToClipboard } from '../../utils/clipboard';
import { openZalo } from '../../utils/zalo';
import { storage } from '../../store/storage';

// ── Types ─────────────────────────────────────────────────────
export type ZaloTemplate = { tone: string; body: string };

type Props = {
  title: string;
  recipient: string;          // e.g. "7 phụ huynh chưa nộp" or "Nhóm Lớp 9 · Toán"
  message: string;            // initial message text
  hint?: string;              // shown in the "Mở Zalo → dán vào…" instruction
  phone?: string;             // SĐT phụ huynh → mở đúng chat (1 chạm); rỗng → share/copy
  templates?: ZaloTemplate[]; // optional tone selector
  /** Bật "mẫu của tôi": GV sửa tin rồi Lưu làm mẫu — lần sau tự dùng mẫu đó.
   *  Tên/số tiền... được thay bằng chỗ trống {ten}{tien}... nên mẫu dùng lại được cho mọi người. */
  templateKey?: string;
  /** Giá trị thay vào chỗ trống của mẫu, vd { ten: 'Bình', tien: '500.000đ', thang: '7' } */
  vars?: Record<string, string>;
  onConfirm: () => void;
  onClose: () => void;
};

// Điền giá trị vào mẫu: "{ten} ơi" + {ten:'Bình'} → "Bình ơi"
const applyVars = (tpl: string, vars?: Record<string, string>) =>
  Object.entries(vars || {}).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(v), tpl);

// Ngược lại khi LƯU mẫu: đổi giá trị cụ thể về chỗ trống (thay chuỗi dài trước để tránh cắt nhầm).
const extractVars = (text: string, vars?: Record<string, string>) =>
  Object.entries(vars || {})
    .filter(([, v]) => v && v.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .reduce((acc, [k, v]) => acc.split(v).join(`{${k}}`), text);

export function ZaloCopySheet({ title, recipient, message, hint, phone, templates, templateKey, vars, onConfirm, onClose }: Props) {
  const [tpl, setTpl] = useState(0);
  const [text, setText] = useState(
    templates ? templates[0].body : message
  );
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [tplSaved, setTplSaved] = useState(false);

  // Có mẫu GV đã lưu → dùng mẫu đó thay tin mặc định.
  useEffect(() => {
    if (!templateKey) return;
    let alive = true;
    storage.get('tpl_' + templateKey)
      .then(saved => { if (alive && saved) setText(applyVars(saved, vars)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [templateKey]);

  const saveTpl = async () => {
    if (!templateKey) return;
    try {
      await storage.set('tpl_' + templateKey, extractVars(text, vars));
      setTplSaved(true);
      setTimeout(() => setTplSaved(false), 2000);
    } catch {}
  };

  const resetTpl = async () => {
    if (templateKey) { try { await storage.delete('tpl_' + templateKey); } catch {} }
    setText(templates ? templates[tpl].body : message);
    setCopied(false);
  };

  const handleTpl = (i: number) => {
    setTpl(i);
    setText(templates![i].body);
    setCopied(false);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) setCopied(true);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => { onConfirm(); }, 1200);
  };

  if (confirmed) {
    return (
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => {}}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <View style={s.successCircle}>
              <IconCheck size={28} color={colors.green600} />
            </View>
            <Text style={s.successTitle}>Đã đánh dấu là đã gửi</Text>
            <Text style={s.successSub}>Bạn nhớ đã dán và gửi trong Zalo nhé.</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={s.overlay} onPress={onClose} activeOpacity={1}>
      {/* Bàn phím hiện lên thì đẩy sheet theo — không che mất ô đang gõ */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ justifyContent: 'flex-end' }}>
      <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={() => {}}>
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <View style={s.zaloIconBox}>
            <IconZalo size={18} color="#3a7dd3" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.recipient}>{recipient}</Text>
          </View>
        </View>

        {/* Tone selector */}
        {templates && templates.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{ gap: 7, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}
          >
            {templates.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={[s.toneChip, tpl === i && s.toneChipActive]}
                onPress={() => handleTpl(i)}
              >
                <Text style={[s.toneChipText, tpl === i && s.toneChipTextActive]}>{t.tone}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Editable message */}
        <Text style={s.editLabel}>NỘI DUNG · chỉnh sửa tuỳ ý</Text>
        <TextInput
          style={s.messageInput}
          value={text}
          onChangeText={v => { setText(v); setCopied(false); }}
          multiline
          scrollEnabled={false}
        />

        {/* Mẫu của tôi — GV sửa theo giọng mình rồi lưu, lần sau tự dùng */}
        {templateKey && (
          <View style={s.tplRow}>
            <TouchableOpacity onPress={saveTpl} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.tplLink}>{tplSaved ? '✓ Đã lưu mẫu của bạn' : 'Lưu làm mẫu của tôi'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetTpl} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.tplLinkMuted}>Dùng mẫu gốc</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Copy button */}
        {!copied ? (
          <TouchableOpacity style={s.copyBtn} onPress={handleCopy}>
            <Text style={s.copyBtnText}>Copy tin nhắn</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.copiedBox}>
            <View style={s.copiedRow}>
              <View style={s.copiedCheck}>
                <IconCheck size={14} color={colors.green700} />
              </View>
              <Text style={s.copiedText}>Đã copy vào bộ nhớ tạm</Text>
            </View>
            <Text style={s.hintText}>
              {phone
                ? 'Bấm "Mở Zalo phụ huynh" → đúng chat mở ra → dán (giữ ô nhập tin) → Gửi'
                : `Mở Zalo → tìm ${hint ? `"${hint}"` : 'nhóm lớp'} → dán (giữ ô nhập tin) → Gửi`}
            </Text>
          </View>
        )}

        {/* Open Zalo — mở đúng chat (nếu có SĐT) + tự copy nội dung; gửi thật diễn ra trong Zalo */}
        <TouchableOpacity
          style={s.zaloBtn}
          onPress={async () => { await openZalo(phone, text); setCopied(true); }}
          activeOpacity={0.85}
        >
          <IconZalo size={18} color="white" />
          <Text style={s.zaloBtnText}>
            {phone ? 'Mở Zalo phụ huynh (đã copy tin)' : 'Mở Zalo để dán & gửi'}
          </Text>
        </TouchableOpacity>

        {/* Self-confirmation — teacher tells the app she already sent it */}
        <TouchableOpacity
          style={[s.confirmBtn, !copied && s.confirmBtnDisabled]}
          onPress={copied ? handleConfirm : undefined}
          activeOpacity={copied ? 0.8 : 1}
        >
          <IconCheck size={18} color={copied ? 'white' : colors.textMuted} />
          <Text style={[s.confirmBtnText, !copied && { color: colors.textMuted }]}>
            Tôi đã gửi trong Zalo
          </Text>
        </TouchableOpacity>

        {!copied && (
          <Text style={s.confirmHint}>Copy tin nhắn trước, mở Zalo dán &amp; gửi, rồi xác nhận</Text>
        )}
      </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(20,30,25,0.45)', justifyContent: 'flex-end',
  } as any,
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 36,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0ddd5', alignSelf: 'center', marginBottom: 18 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  zaloIconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#e8f2fb', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  recipient: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  toneChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: 'white', alignSelf: 'center' },
  toneChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  toneChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  toneChipTextActive: { color: colors.green700 },

  editLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3, marginBottom: 6 },
  tplRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -6, marginBottom: 12, paddingHorizontal: 2 },
  tplLink: { fontSize: 13.5, fontWeight: '700', color: colors.green700 },
  tplLinkMuted: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  messageInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 16,
    padding: 14, fontSize: 14, lineHeight: 22, color: colors.textPrimary,
    backgroundColor: colors.bg, marginBottom: 14, minHeight: 90,
    textAlignVertical: 'top',
  },

  copyBtn: {
    height: 52, borderRadius: 14, backgroundColor: colors.green500,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  copyBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },

  copiedBox: {
    backgroundColor: colors.green50, borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: colors.green100,
  },
  copiedRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  copiedCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' },
  copiedText: { fontSize: 14, fontWeight: '700', color: colors.green700 },
  hintText: { fontSize: 12, color: colors.green700, lineHeight: 18 },

  zaloBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#3a7dd3',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 10,
  },
  zaloBtnMuted: { backgroundColor: '#e8f2fb' },
  zaloBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },

  confirmBtn: {
    height: 52, borderRadius: 14, backgroundColor: colors.green600,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmBtnDisabled: { backgroundColor: colors.surfaceAlt },
  confirmBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  confirmHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },

  successCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  successSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
});
