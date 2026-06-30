import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors } from '../../theme';
import { storage } from '../../store/storage';
import { getPromo, Promo } from '../../api/promo';
import { IconX, IconChevron } from '../../components/icons';

const DISMISS_KEY = 'promo_dismissed_id';

/** Owner-controlled, dismissible promo banner. Server-driven via GET /promo. */
export function PromoBanner() {
  const [promo, setPromo] = useState<Promo | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getPromo();
        if (!alive || !p?.active || !p.title) return;
        const dismissed = await storage.get(DISMISS_KEY);
        if (dismissed === p.id) return; // already dismissed this campaign
        setPromo(p);
      } catch {
        // silent — banner is non-essential
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!promo) return null;

  const dismiss = () => {
    storage.set(DISMISS_KEY, promo.id).catch(() => {});
    setPromo(null);
  };

  const openCta = () => {
    if (promo.cta_url) Linking.openURL(promo.cta_url).catch(() => {});
  };

  return (
    <View style={s.card}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{promo.title}</Text>
        {!!promo.body && <Text style={s.body}>{promo.body}</Text>}
        {!!promo.cta_label && !!promo.cta_url && (
          <TouchableOpacity style={s.cta} onPress={openCta} activeOpacity={0.85}>
            <Text style={s.ctaText}>{promo.cta_label}</Text>
            <IconChevron size={13} color={colors.green700} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={s.close} onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <IconX size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.honey100, borderRadius: 16,
    borderWidth: 1, borderColor: '#f0d99a', padding: 14, marginBottom: 12,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#5a4a2a' },
  body: { fontSize: 13, color: '#7a6638', lineHeight: 19, marginTop: 3 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginTop: 10, backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: colors.green200 },
  ctaText: { fontSize: 13, fontWeight: '700', color: colors.green700 },
  close: { padding: 2, marginLeft: 8 },
});
