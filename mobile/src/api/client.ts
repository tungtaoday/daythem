import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../store/storage';

// Production builds MUST set EXPO_PUBLIC_API_URL (EAS env / app config) to the real
// backend. In dev it falls back to localhost (web), the Android-emulator host, or
// EXPO_PUBLIC_API_URL for testing on a physical device over LAN.
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

export const API_URL = ENV_URL
  ? ENV_URL
  : __DEV__
    ? Platform.OS === 'web'
      ? 'http://localhost:8000/api/v1'     // web browser → localhost
      : 'http://10.0.2.2:8000/api/v1'      // Android emulator → host machine
    : 'https://daythem.doitay.vn/api/v1';  // prod fallback (override via EXPO_PUBLIC_API_URL)

const api = axios.create({ baseURL: API_URL });

// Registered by auth store to avoid circular imports
let _getMemToken: (() => string | null) | null = null;
export function registerTokenGetter(fn: () => string | null) {
  _getMemToken = fn;
}

let _onUnauthorized: (() => void) | null = null;
export function registerAuthLogout(cb: () => void) {
  _onUnauthorized = cb;
}

// True only when a real (non-demo) token is persisted in storage.
// Lets the response interceptor stay synchronous while distinguishing
// real sessions (auto-logout on 401) from demo sessions (ignore 401).
let _hasStoredToken = false;
export function setStoredTokenFlag(val: boolean) {
  _hasStoredToken = val;
}

api.interceptors.request.use(async (config) => {
  // Prefer persisted token; fall back to in-memory demo token
  const stored = await storage.get('auth_token');
  const token = stored ?? _getMemToken?.() ?? null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // 401 on a real session = token expired → clear and redirect to login
    if (error.response?.status === 401 && _hasStoredToken) {
      _hasStoredToken = false;
      storage.delete('auth_token').catch(() => {});
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
