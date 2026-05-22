import { create } from 'zustand';
import { storage } from './storage';
import { requestOTP, verifyOTP, getMe, updateProfile } from '../api/auth';

export type Gender = 'co' | 'thay';

type Teacher = {
  id: string; phone: string; name: string | null;
  avatar_url: string | null; gender?: Gender;
};

type AuthState = {
  teacher: Teacher | null;
  token: string | null;
  isLoading: boolean;
  requestOTP: (phone: string) => Promise<{ dev_code: string }>;
  verifyOTP: (phone: string, code: string) => Promise<void>;
  loadMe: () => Promise<void>;
  updateProfile: (name: string, gender?: Gender) => Promise<void>;
  setGender: (gender: Gender) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  teacher: null,
  token: null,
  isLoading: false,

  requestOTP: async (phone) => {
    set({ isLoading: true });
    try {
      const data = await requestOTP(phone);
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOTP: async (phone, code) => {
    set({ isLoading: true });
    try {
      const data = await verifyOTP(phone, code);
      const gender = (await storage.get('teacher_gender') as Gender | null) ?? 'co';
      await storage.set('auth_token', data.token);
      set({ token: data.token, teacher: { ...data.teacher, gender } });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMe: async () => {
    const token = await storage.get('auth_token');
    if (!token) return;
    try {
      const teacher = await getMe();
      const gender = (await storage.get('teacher_gender') as Gender | null) ?? 'co';
      set({ token, teacher: { ...teacher, gender } });
    } catch {
      await storage.delete('auth_token');
    }
  },

  updateProfile: async (name, gender) => {
    const prev = get().teacher;
    const newGender = gender ?? prev?.gender ?? 'co';
    await storage.set('teacher_gender', newGender);
    try {
      const teacher = await updateProfile(name);
      set({ teacher: { ...teacher, gender: newGender } });
    } catch {
      // offline — update locally
      set({ teacher: { ...prev!, name, gender: newGender } });
    }
  },

  setGender: async (gender) => {
    await storage.set('teacher_gender', gender);
    set(s => ({ teacher: s.teacher ? { ...s.teacher, gender } : s.teacher }));
  },

  logout: async () => {
    await storage.delete('auth_token');
    set({ teacher: null, token: null });
  },
}));
