import { create } from 'zustand';
import * as classApi from '../api/classes';
import * as studentApi from '../api/students';

type Class = {
  id: string; name: string; subject: string; grade: string;
  default_fee: number; fee_type: string; student_count: number;
  schedule: any; zalo_group_id: string | null;
};

type Student = {
  id: string; name: string; parent_name: string | null; parent_phone: string | null;
  note: string | null; fee_setting: any | null;
};

type ClassesState = {
  classes: Class[];
  students: Record<string, Student[]>;
  isLoading: boolean;
  fetchClasses: () => Promise<void>;
  createClass: (body: classApi.ClassBody) => Promise<Class>;
  updateClass: (id: string, body: any) => Promise<void>;
  fetchStudents: (classId: string) => Promise<void>;
  addStudent: (classId: string, body: any) => Promise<Student>;
  setStudentFee: (studentId: string, body: any) => Promise<void>;
};

export const useClassesStore = create<ClassesState>((set, get) => ({
  classes: [],
  students: {},
  isLoading: false,

  fetchClasses: async () => {
    set({ isLoading: true });
    try {
      const classes = await classApi.listClasses();
      set({ classes });
    } catch {
      // API lỗi → giữ danh sách hiện tại, screen tự fallback demo data
    } finally {
      set({ isLoading: false });
    }
  },

  createClass: async (body) => {
    const klass = await classApi.createClass(body);
    set(s => ({ classes: [...s.classes, klass] }));
    return klass;
  },

  updateClass: async (id, body) => {
    const updated = await classApi.updateClass(id, body);
    set(s => ({ classes: s.classes.map(c => c.id === id ? updated : c) }));
  },

  fetchStudents: async (classId) => {
    try {
      const students = await studentApi.listStudents(classId);
      set(s => ({ students: { ...s.students, [classId]: students } }));
    } catch {
      // API lỗi → không set, screen tự fallback demo data
    }
  },

  addStudent: async (classId, body) => {
    const student = await studentApi.addStudent(classId, body);
    set(s => ({
      students: { ...s.students, [classId]: [...(s.students[classId] || []), student] },
      classes: s.classes.map(c => c.id === classId ? { ...c, student_count: c.student_count + 1 } : c),
    }));
    return student;
  },

  setStudentFee: async (studentId, body) => {
    await studentApi.setStudentFee(studentId, body);
  },
}));
