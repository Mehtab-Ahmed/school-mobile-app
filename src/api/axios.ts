import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️  UPDATE THIS to your machine's current local IP (run `ipconfig` on Windows / `ifconfig` on Mac)
// For physical device: must be your machine's WiFi IP on the same network as the phone
// For Android emulator: use 10.0.2.2 instead of your local IP
// For iOS simulator: use localhost
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.8:8080/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        const newToken = data.data?.accessToken;
        if (newToken) {
          await SecureStore.setItemAsync('accessToken', newToken);
          queue.forEach((cb) => cb(newToken));
          queue = [];
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
