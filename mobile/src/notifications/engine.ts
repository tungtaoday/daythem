import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { storage } from '../store/storage';
import {
  getNotifConfig, getCampaigns, registerPushToken, logNotifEvent,
  NotifConfig,
} from '../api/notify';
import { getDays } from '../utils/schedule';

const FIRED_CAMPAIGNS_KEY = 'notif_fired_campaigns';
const isWeb = Platform.OS === 'web';

// our schedule.day: 1=Mon..7=Sun  →  expo weekday: 1=Sun..7=Sat
function toExpoWeekday(day: number): number {
  return (day % 7) + 1;
}

function parseHM(s?: string): { hour: number; minute: number } | null {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

// subtract `lead` minutes from a weekday/time, rolling back the weekday if it crosses midnight
function minusLead(day: number, hour: number, minute: number, lead: number) {
  let total = hour * 60 + minute - lead;
  let d = day;
  while (total < 0) { total += 1440; d = d - 1 < 1 ? 7 : d - 1; }
  return { day: d, hour: Math.floor(total / 60), minute: total % 60 };
}

function inQuiet(hour: number, minute: number, quiet?: [string, string]): boolean {
  if (!quiet) return false;
  const a = parseHM(quiet[0]); const b = parseHM(quiet[1]);
  if (!a || !b) return false;
  const t = hour * 60 + minute, s = a.hour * 60 + a.minute, e = b.hour * 60 + b.minute;
  // window may wrap midnight (e.g., 22:00–07:00)
  return s <= e ? (t >= s && t < e) : (t >= s || t < e);
}

// ── Public: call once at app root ──
export function initNotifications() {
  if (isWeb) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    }),
  });
  Notifications.addNotificationReceivedListener(n => {
    const d: any = n.request.content.data || {};
    logNotifEvent(d.channel || 'utility', 'delivered', d.rule);
  });
  Notifications.addNotificationResponseReceivedListener(r => {
    const d: any = r.notification.request.content.data || {};
    logNotifEvent(d.channel || 'utility', 'opened', d.rule);
  });
}

async function ensurePermission(): Promise<boolean> {
  if (isWeb) return false;
  const cur = await Notifications.getPermissionsAsync();
  let status = cur.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'GieoChữ', importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return status === 'granted';
}

async function registerToken() {
  try {
    const projectId = (Constants as any)?.expoConfig?.extra?.eas?.projectId;
    const tok = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (tok?.data) await registerPushToken(tok.data);
  } catch { /* push token optional */ }
}

type ClassLite = { id: string; name: string; subject?: string; student_count?: number; schedule?: any };

// ── Public: reschedule everything from current config + classes ──
export async function syncNotifications(classes: ClassLite[], genderWord: string = 'cô') {
  if (isWeb) return;
  const granted = await ensurePermission();
  if (!granted) return;
  registerToken(); // fire-and-forget (Phase 2 remote push)

  let cfg: NotifConfig;
  try { cfg = await getNotifConfig(); } catch { return; }
  const quiet = cfg.contact_policy?.quiet_hours;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const sched = async (content: any, trigger: any) => {
    try { await Notifications.scheduleNotificationAsync({ content, trigger }); } catch { /* ignore */ }
  };

  // ── Utility rules ──
  const r = cfg.rules || {};

  // class_reminder: weekly, lead before each class
  if (r.class_reminder?.enabled !== false) {
    const lead = r.class_reminder?.lead_minutes ?? 30;
    for (const c of classes) {
      const hm = parseHM(c.schedule?.start_time);
      if (!hm) continue;
      // 1 lớp có thể nhiều ngày/tuần → 1 nhắc nhở/tuần cho MỖI thứ.
      for (const day of getDays(c.schedule)) {
        const t = minusLead(day, hm.hour, hm.minute, lead);
        if (inQuiet(t.hour, t.minute, quiet)) continue;
        await sched(
          { title: `Sắp tới giờ dạy ${c.name}`, body: `${c.schedule?.start_time} · ${c.student_count || 0} học sinh · ${c.schedule?.location || 'tại nhà'}`, data: { channel: 'utility', rule: 'class_reminder' } },
          { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: toExpoWeekday(t.day), hour: t.hour, minute: t.minute },
        );
      }
    }
  }

  // morning_summary: daily
  if (r.morning_summary?.enabled !== false) {
    const hm = parseHM(r.morning_summary?.at) || { hour: 7, minute: 0 };
    if (!inQuiet(hm.hour, hm.minute, quiet)) {
      await sched(
        { title: 'Chào buổi sáng 🌿', body: `Mở GieoChữ xem lịch dạy & việc cần làm hôm nay nhé ${genderWord}.`, data: { channel: 'utility', rule: 'morning_summary' } },
        { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hm.hour, minute: hm.minute },
      );
    }
  }

  // tuition_reminder: monthly (one-shot next occurrence; re-scheduled on each sync)
  if (r.tuition_reminder?.enabled !== false) {
    const hm = parseHM(r.tuition_reminder?.at) || { hour: 9, minute: 0 };
    const dom = r.tuition_reminder?.day_of_month ?? 28;
    const next = nextMonthlyDate(dom, hm.hour, hm.minute);
    if (next && !inQuiet(hm.hour, hm.minute, quiet)) {
      await sched(
        { title: 'Cuối tháng rồi 💰', body: 'Kiểm tra ai chưa nộp học phí và gửi nhắc nhẹ qua Zalo nhé.', data: { channel: 'utility', rule: 'tuition_reminder' } },
        { type: Notifications.SchedulableTriggerInputTypes.DATE, date: next },
      );
    }
  }

  // report_reminder: weekly
  if (r.report_reminder?.enabled !== false) {
    const hm = parseHM(r.report_reminder?.at) || { hour: 19, minute: 0 };
    const wd = r.report_reminder?.weekday ?? 7; // 1=Mon..7=Sun
    if (!inQuiet(hm.hour, hm.minute, quiet)) {
      await sched(
        { title: 'Gửi báo cáo tuần 📊', body: 'Tổng kết tuần cho phụ huynh chỉ mất 1 phút — mở GieoChữ nhé.', data: { channel: 'utility', rule: 'report_reminder' } },
        { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: toExpoWeekday(wd), hour: hm.hour, minute: hm.minute },
      );
    }
  }

  // ── Marketing campaigns (server-driven, capped/fatigue on server) ──
  try {
    const { campaigns } = await getCampaigns();
    const firedRaw = await storage.get(FIRED_CAMPAIGNS_KEY);
    const fired: string[] = firedRaw ? JSON.parse(firedRaw) : [];
    for (const c of campaigns) {
      if (fired.includes(c.id)) continue;
      const hm = parseHM(c.at || undefined);
      let when: Date;
      if (hm && !inQuiet(hm.hour, hm.minute, quiet)) {
        when = atTimeTodayOrTomorrow(hm.hour, hm.minute);
      } else {
        when = new Date(Date.now() + 60 * 1000); // ~1 min out
      }
      await sched(
        { title: c.title, body: c.body, data: { channel: 'marketing', rule: c.id, cta_url: c.cta_url } },
        { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      );
      fired.push(c.id);
    }
    await storage.set(FIRED_CAMPAIGNS_KEY, JSON.stringify(fired.slice(-50)));
  } catch { /* marketing optional */ }
}

// next calendar date for a day-of-month at hour:minute (this month if future, else next month)
function nextMonthlyDate(dom: number, hour: number, minute: number): Date | null {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), dom, hour, minute, 0, 0);
  if (d.getTime() <= now.getTime()) d = new Date(now.getFullYear(), now.getMonth() + 1, dom, hour, minute, 0, 0);
  return d;
}

function atTimeTodayOrTomorrow(hour: number, minute: number): Date {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (d.getTime() <= now.getTime()) d = new Date(d.getTime() + 24 * 3600 * 1000);
  return d;
}
