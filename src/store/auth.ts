import { create } from 'zustand';
import { storage } from './storage';
import { requestOTP, verifyOTP, getMe, updateProfile } from '../api/auth';

type Teacher = { id: string; phone: string; name: string | null; avatar_url: string | null };

type AuthState = {
  teacher: Teacher | null;
  token: string | null;
  isLoading: boolean;
  requestOTP: (phone: string) => Promise<{ dev_code: string }>;
  verifyOTP: (phone: string, code: string) => Promise<void>;
  loadMe: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
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
      await storage.set('auth_token', data.token);
      set({ token: data.token, teacher: data.teacher });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMe: async () => {
    const token = await storage.get('auth_token');
    if (!token) return;
    try {
      const teacher = await getMe();
      set({ token, teacher });
    } catch {
      await storage.delete('auth_token');
    }
  },

  updateProfile: async (name) => {
    const teacher = await updateProfile(name);
    set({ teacher });
  },

  logout: async () => {
    await storage.delete('auth_token');
    set({ teacher: null, token: null });
  },
}));
