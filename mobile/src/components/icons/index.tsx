// Maps design's icon names → Ionicons (stroke, rounded — closest to the SVG icons in DayThem.html)
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconProps = { size?: number; color?: string; stroke?: number };

const ico = (name: keyof typeof Ionicons.glyphMap) =>
  ({ size = 22, color = 'currentColor' }: IconProps) =>
    <Ionicons name={name} size={size} color={color} />;

export const IconHome        = ico('home-outline');
export const IconCalendar    = ico('calendar-outline');
export const IconUsers       = ico('people-outline');
export const IconWallet      = ico('wallet-outline');
export const IconChart       = ico('bar-chart-outline');
export const IconCheck       = ico('checkmark-outline');
export const IconCheckCircle = ico('checkmark-circle-outline');
export const IconX           = ico('close-outline');
export const IconClock       = ico('time-outline');
export const IconBell        = ico('notifications-outline');
export const IconChevron     = ico('chevron-forward-outline');
export const IconChevronDown = ico('chevron-down-outline');
export const IconPlus        = ico('add-outline');
export const IconSend        = ico('send-outline');
export const IconBook        = ico('book-outline');
export const IconPhone       = ico('call-outline');
export const IconWarn        = ico('warning-outline');
export const IconStar        = ico('star-outline');
export const IconSearch      = ico('search-outline');
export const IconArrowLeft   = ico('arrow-back-outline');
export const IconFilter      = ico('filter-outline');
export const IconNote        = ico('document-text-outline');
export const IconSparkle     = ico('sparkles-outline');
export const IconSettings    = ico('settings-outline');
export const IconTrash       = ico('trash-outline');
export const IconEdit        = ico('create-outline');
export const IconShare       = ico('share-social-outline');

// Zalo — custom SVG via Text approximation (no official icon in Ionicons)
export function IconZalo({ size = 22, color = '#0068FF' }: { size?: number; color?: string }) {
  return (
    <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
  );
}
