import { create } from 'zustand';
import { storage } from './storage';
import { loginWithPassword as loginApi, getMe, updateProfile, updateTaxProfile as updateTaxApi, TaxProfileFields } from '../api/auth';
import { registerAuthLogout, registerTokenGetter, setStoredTokenFlag } from '../api/client';

export type Gender = 'co' | 'thay';

/** A demo session is the offline fallback — its token is minted locally, not by the API. */
export function isDemoToken(token: string | null): boolean {
  return !!token && token.startsWith('demo-');
}

type Teacher = {
  id: string; phone: string; name: string | null;
  avatar_url: string | null; gender?: Gender;
  tax_id?: string | null;
  full_legal_name?: string | null;
  id_number?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
};

type AuthState = {
  teacher: Teacher | null;
  token: string | null;
  isLoading: boolean;
  loginWithPassword: (phone: string, password: string) => Promise<void>;
  loadMe: () => Promise<void>;
  updateProfile: (name: string, gender?: Gender) => Promise<void>;
  updateTaxProfile: (fields: TaxProfileFields) => Promise<void>;
  setGender: (gender: Gender) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  teacher: null,
  token: null,
  isLoading: false,

  loginWithPassword: async (phone, password) => {
    set({ isLoading: true });
    try {
      const data = await loginApi(phone, password);
      const gender = (await storage.get('teacher_gender') as Gender | null) ?? 'co';
      await storage.set('auth_token', data.token);
      setStoredTokenFlag(true);
      set({ token: data.token, teacher: { ...data.teacher, gender } });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Sai mật khẩu — finally sẽ reset isLoading, lỗi trả về PasswordScreen
        throw err;
      }
      // Mất mạng / server down → demo mode (token chỉ trong memory, không lưu storage)
      const mockToken = 'demo-' + Date.now();
      const gender = (await storage.get('teacher_gender') as Gender | null) ?? 'co';
      set({ token: mockToken, teacher: { id: 'demo', phone, name: null, avatar_url: null, gender } });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMe: async () => {
    const token = await storage.get('auth_token');
    if (!token) return;
    setStoredTokenFlag(true);
    try {
      const teacher = await getMe();
      const gender = (await storage.get('teacher_gender') as Gender | null) ?? 'co';
      set({ token, teacher: { ...teacher, gender } });
    } catch {
      // Lỗi mạng thoáng qua → giữ token, không đăng xuất
      // Token hết hạn (401) → response interceptor tự xử lý
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
      set({ teacher: { ...prev!, name, gender: newGender } });
    }
  },

  updateTaxProfile: async (fields) => {
    const updated = await updateTaxApi(fields);
    const gender = get().teacher?.gender ?? 'co';
    set({ teacher: { ...updated, gender } });
  },

  setGender: async (gender) => {
    await storage.set('teacher_gender', gender);
    set(s => ({ teacher: s.teacher ? { ...s.teacher, gender } : s.teacher }));
  },

  logout: async () => {
    await storage.delete('auth_token');
    setStoredTokenFlag(false);
    set({ teacher: null, token: null });
  },
}));

registerAuthLogout(() => {
  useAuthStore.setState({ teacher: null, token: null });
});
registerTokenGetter(() => useAuthStore.getState().token);
