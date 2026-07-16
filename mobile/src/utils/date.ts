// Tháng/ngày theo GIỜ ĐỊA PHƯƠNG — không dùng toISOString() (UTC) vì sáng mùng 1
// trước 7h (VN = UTC+7) sẽ bị lệch về tháng trước.
export function localMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function localDate(d = new Date()): string {
  return `${localMonth(d)}-${String(d.getDate()).padStart(2, '0')}`;
}
