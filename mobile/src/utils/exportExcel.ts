import * as XLSX from 'xlsx';
import { Platform, Alert } from 'react-native';

type ColWidth = { wch: number };

function buildWorkbook(data: Record<string, unknown>[], sheetName: string, colWidths: ColWidth[]) {
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

function webDownload(wb: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function nativeShare(wb: XLSX.WorkBook, filename: string) {
  try {
    // Dynamic import to avoid web bundling issues — `as any` is intentional here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [FS, Sharing] = await Promise.all([
      import('expo-file-system') as Promise<any>,
      import('expo-sharing') as Promise<any>,
    ]);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' }) as string;
    const uri = FS.cacheDirectory + filename;
    await FS.writeAsStringAsync(uri, wbout, { encoding: 'base64' });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Xuất file Excel',
    });
  } catch {
    Alert.alert('Lỗi', 'Không thể xuất file trên thiết bị này.');
  }
}

async function exportFile(wb: XLSX.WorkBook, filename: string) {
  if (Platform.OS === 'web') {
    webDownload(wb, filename);
  } else {
    await nativeShare(wb, filename);
  }
}

export type StudentExportRow = {
  name: string;
  parent_phone: string | null;
  attend?: number;
  debt?: number;
};

export async function exportStudentsExcel(students: StudentExportRow[], className: string) {
  const data = students.map((s, i) => ({
    'STT': i + 1,
    'Họ và tên': s.name,
    'SĐT phụ huynh': s.parent_phone ?? '',
    'Chuyên cần (%)': s.attend != null ? s.attend : '',
    'Còn nợ (đ)': s.debt ?? 0,
  }));
  const wb = buildWorkbook(data, 'Học sinh', [
    { wch: 5 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
  ]);
  const safe = className.replace(/[/\\?%*:|"<>]/g, '-');
  await exportFile(wb, `${safe}_danh-sach.xlsx`);
}

export type TuitionExportRow = {
  student_name: string;
  amount: number;
  paid: boolean;
  paid_date?: string | null;
};

export async function exportTuitionExcel(
  items: TuitionExportRow[],
  className: string,
  monthLabel: string
) {
  const data = items.map((it, i) => ({
    'STT': i + 1,
    'Họ và tên': it.student_name,
    'Học phí (đ)': it.amount,
    'Trạng thái': it.paid ? 'Đã nộp' : 'Chưa nộp',
    'Ngày nộp': it.paid_date ?? '',
  }));
  const sheetName = monthLabel.slice(0, 31); // Excel sheet name max 31 chars
  const wb = buildWorkbook(data, sheetName, [
    { wch: 5 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
  ]);
  const safe = className.replace(/[/\\?%*:|"<>]/g, '-');
  await exportFile(wb, `${safe}_hoc-phi.xlsx`);
}
