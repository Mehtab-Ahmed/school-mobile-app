import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// For Android emulator: use 10.0.2.2 instead of localhost
// For physical device: use your machine's IP address e.g. http://192.168.1.x:8081/api/v1
// For iOS simulator: localhost works fine
const BASE_URL = 'http://10.194.48.124:8080/api/v1';

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
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
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
