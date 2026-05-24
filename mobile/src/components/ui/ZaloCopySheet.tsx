import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { colors } from '../../theme';
import { IconZalo, IconCheck } from '../icons';

// ── Clipboard helper (web-safe) ───────────────────────────────
async function copyText(text: string): Promise<boolean> {
  try {
    await (navigator as any).clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ── Types ─────────────────────────────────────────────────────
export type ZaloTemplate = { tone: string; body: string };

type Props = {
  title: string;
  recipient: string;          // e.g. "7 phụ huynh chưa nộp" or "Nhóm Lớp 9 · Toán"
  message: string;            // initial message text
  hint?: string;              // shown in the "Mở Zalo → dán vào…" instruction
  templates?: ZaloTemplate[]; // optional tone selector
  onConfirm: () => void;
  onClose: () => void;
};

export function ZaloCopySheet({ title, recipient, message, hint, templates, onConfirm, onClose }: Props) {
  const [tpl, setTpl] = useState(0);
  const [text, setText] = useState(
    templates ? templates[0].body : message
  );
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleTpl = (i: number) => {
    setTpl(i);
    setText(templates![i].body);
    setCopied(false);
  };

  const handleCopy = async () => {
    const ok = await copyText(text);
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
            <Text style={s.successTitle}>Đã xác nhận gửi!</Text>
            <Text style={s.successSub}>Tin nhắn đã được ghi nhận vào lịch sử thông báo.</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={s.overlay} onPress={onClose} activeOpacity={1}>
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
              Mở Zalo → tìm {hint ? `"${hint}"` : 'nhóm lớp'} → dán (giữ ô nhập tin) → Gửi
            </Text>
          </View>
        )}

        {/* Confirm sent */}
        <TouchableOpacity
          style={[s.confirmBtn, !copied && s.confirmBtnDisabled]}
          onPress={copied ? handleConfirm : undefined}
          activeOpacity={copied ? 0.8 : 1}
        >
          <IconCheck size={18} color={copied ? 'white' : colors.textMuted} />
          <Text style={[s.confirmBtnText, !copied && { color: colors.textMuted }]}>
            Đã gửi Zalo ✓
          </Text>
        </TouchableOpacity>

        {!copied && (
          <Text style={s.confirmHint}>Copy tin nhắn trước, sau đó xác nhận đã gửi</Text>
        )}
      </TouchableOpacity>
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
