// Bảng màu nhận diện lớp — mỗi lớp chọn 1 màu, dùng cho gradient hero + chấm màu.
export type ClassColorKey = 'green' | 'blue' | 'coral' | 'honey' | 'purple' | 'slate';

type ClassColor = {
  key: ClassColorKey;
  label: string;
  grad: [string, string];  // gradient hero (sáng → đậm)
  dot: string;             // chấm màu trong danh sách
  tint: string;            // nền nhạt (badge/accent)
};

export const CLASS_COLORS: Record<ClassColorKey, ClassColor> = {
  green:  { key: 'green',  label: 'Xanh lá', grad: ['#55b083', '#2f6849'], dot: '#4a9e72', tint: '#e8f5ee' },
  blue:   { key: 'blue',   label: 'Xanh dương', grad: ['#5b9bd5', '#2f6aa0'], dot: '#4a86c5', tint: '#e8f0fa' },
  coral:  { key: 'coral',  label: 'Cam san hô', grad: ['#ec8b73', '#c2593f'], dot: '#e07a5f', tint: '#ffe9e0' },
  honey:  { key: 'honey',  label: 'Vàng mật', grad: ['#e9b84d', '#c8902a'], dot: '#e0a52e', tint: '#fcefcf' },
  purple: { key: 'purple', label: 'Tím', grad: ['#9b7bd4', '#6a4ca0'], dot: '#8a6bc5', tint: '#efe9fa' },
  slate:  { key: 'slate',  label: 'Xám đá', grad: ['#7c8a9e', '#4a5a6e'], dot: '#6b7d92', tint: '#eceff3' },
};

export const CLASS_COLOR_KEYS = Object.keys(CLASS_COLORS) as ClassColorKey[];
export const DEFAULT_CLASS_COLOR: ClassColorKey = 'green';

export function classColor(key?: string | null): ClassColor {
  return CLASS_COLORS[(key as ClassColorKey)] || CLASS_COLORS[DEFAULT_CLASS_COLOR];
}
