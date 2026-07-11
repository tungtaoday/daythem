import api from './client';

export const listStudents = (classId: string) =>
  api.get(`/classes/${classId}/students`).then(r => r.data);

export const addStudent = (classId: string, body: { name: string; parent_name?: string; parent_phone?: string; note?: string }) =>
  api.post(`/classes/${classId}/students`, body).then(r => r.data);

export const updateStudent = (id: string, body: Partial<{ name: string; parent_name: string; parent_phone: string; note: string }>) =>
  api.put(`/students/${id}`, body).then(r => r.data);

export const removeStudent = (id: string) => api.delete(`/students/${id}`);

export const setStudentFee = (id: string, body: { fee_type: string; amount?: number; note?: string }) =>
  api.put(`/students/${id}/fee`, body).then(r => r.data);

// Tạo hàng loạt học sinh từ danh sách tên (dán text hoặc kết quả OCR).
export const bulkAddStudents = (classId: string, names: string[]) =>
  api.post(`/classes/${classId}/students/bulk`, { names }).then(r => r.data as { items: any[]; total: number });

// Nhập từ FILE bất kỳ (ảnh/pdf/docx/xlsx/csv/txt) → trả danh sách tên (chưa tạo, GV sửa trước).
export const importStudentNames = (fileBase64: string, mimeType = '', filename = '') =>
  api.post('/students/import', { file_base64: fileBase64, mime_type: mimeType, filename })
    .then(r => r.data.names as string[]);
