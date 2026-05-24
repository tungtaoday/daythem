import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../store/storage';

export const API_URL = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:8000/api/v1'       // web browser → localhost
    : 'http://10.0.2.2:8000/api/v1'        // Android emulator → localhost
  : 'https://your-app.railway.app/api/v1';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await storage.get('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
