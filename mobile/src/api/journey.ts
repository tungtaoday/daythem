import { AppState, Platform } from 'react-native';

import api from './client';

/**
 * Bước chân của giáo viên trong app: mở màn nào, bấm gì.
 *
 * Ba nguyên tắc, theo đúng thứ tự ưu tiên:
 *  1. KHÔNG BAO GIỜ làm hỏng thao tác của GV — mọi lỗi bị nuốt, không await ở
 *     chỗ nào chặn giao diện.
 *  2. Gửi GỘP chứ không bắn từng cái. Màn hình đổi liên tục; mỗi lần đổi một
 *     request sẽ tốn pin và 4G, mà GV phần lớn dùng gói dữ liệu hạn chế.
 *  3. Không kèm nội dung dạy học — chỉ tên màn và tên nút. Tên học sinh, số tiền,
 *     tin nhắn phụ huynh KHÔNG bao giờ được đưa vào đây.
 */

type Step = { screen: string; action?: string; session_id: string; at: string };

const FLUSH_AT = 10;          // đủ 10 bước thì gửi
const FLUSH_EVERY_MS = 30000; // hoặc 30 giây một lần
const MAX_QUEUE = 100;        // mất mạng dài thì bỏ bước cũ, không phình vô hạn

let sessionId = '';
let queue: Step[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let lastScreen = '';
let enabled = false;

const uid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Gửi hàng đợi đi. Fire-and-forget: không throw, không await được từ ngoài. */
function flush(): void {
  if (!queue.length) return;
  const batch = queue;
  queue = [];
  api
    .post('/events/steps', {
      steps: batch,
      platform: Platform.OS,
      app_version: '1.0.0',
    })
    .catch(() => {
      // Mất mạng: trả lại đầu hàng đợi để lần sau gửi lại, nhưng có trần.
      queue = [...batch, ...queue].slice(-MAX_QUEUE);
    });
}

/** Gọi 1 lần khi app khởi động (sau khi đã đăng nhập). */
export function startJourney(): void {
  if (enabled) return;
  enabled = true;
  sessionId = uid();
  lastScreen = '';
  timer = setInterval(flush, FLUSH_EVERY_MS);

  // Rời app là gửi ngay — nếu đợi, phiên cuối cùng của người bỏ cuộc sẽ mất,
  // mà đó đúng là phiên đáng giá nhất.
  AppState.addEventListener('change', (s) => {
    if (s === 'background' || s === 'inactive') flush();
  });
}

/** Dừng khi đăng xuất — không gắn bước chân của người này sang tài khoản khác. */
export function stopJourney(): void {
  flush();
  if (timer) clearInterval(timer);
  timer = null;
  enabled = false;
  sessionId = '';
  lastScreen = '';
  queue = [];
}

function push(step: Omit<Step, 'session_id' | 'at'>): void {
  if (!enabled) return;
  queue.push({ ...step, session_id: sessionId, at: new Date().toISOString() });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  if (queue.length >= FLUSH_AT) flush();
}

/** Mở một màn hình. Bỏ qua nếu trùng màn đang đứng (điều hướng hay bắn lặp). */
export function trackScreen(screen: string): void {
  if (!screen || screen === lastScreen) return;
  lastScreen = screen;
  push({ screen });
}

/** Bấm một nút đáng quan tâm. `action` phải là nhãn cố định, không chứa dữ liệu GV. */
export function trackTap(screen: string, action: string): void {
  push({ screen, action });
}

/** Chỉ dùng trong test. */
export const __journey = {
  size: () => queue.length,
  session: () => sessionId,
  flush,
  reset: () => { queue = []; lastScreen = ''; enabled = false; sessionId = ''; },
};
