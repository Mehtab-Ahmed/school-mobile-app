import axios, { type AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';

/**
 * The server address comes from the build: EXPO_PUBLIC_API_URL (see eas.json) or
 * `extra.apiUrl` in app.config.js. Only a development build falls back to the
 * Android emulator's view of this computer.
 */
const configured =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
export const BASE_URL = configured || (__DEV__ ? 'http://10.0.2.2:8080/api/v1' : 'https://invalid.local/api/v1');
if (!configured && !__DEV__) {
  console.error('EXPO_PUBLIC_API_URL is not set for this build — the app cannot reach the server.');
}

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

// The auth store registers how to sign out locally when a session can't be renewed.
// (Set from outside to avoid a circular import between the store and this client.)
let onSessionExpired: (() => Promise<void> | void) | null = null;
export function setSessionExpiredHandler(handler: () => Promise<void> | void) {
  onSessionExpired = handler;
}

/**
 * Exchanges the refresh token for a new pair. The server rotates refresh tokens —
 * the old one stops working — so the new one must be saved too, or the next
 * renewal fails. Returns null when the server refuses (session really over);
 * throws on network trouble so a flaky connection doesn't sign anyone out.
 */
async function renewSession(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken }, { timeout: 15000 });
    const accessToken: string | undefined = data?.data?.accessToken;
    const nextRefresh: string | undefined = data?.data?.refreshToken;
    if (!accessToken) return null;
    await SecureStore.setItemAsync('accessToken', accessToken);
    if (nextRefresh) await SecureStore.setItemAsync('refreshToken', nextRefresh);
    return accessToken;
  } catch (e) {
    if (axios.isAxiosError(e) && !e.response) throw e;
    return null;
  }
}

// Several screens can hit an expired token at once; they all wait for one renewal.
let renewing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    // The server blocks everything until a temporary password is replaced.
    if (error.response?.status === 403 && error.response?.data?.errors?.code === 'PASSWORD_CHANGE_REQUIRED') {
      router.replace('/(auth)/change-password' as Href);
      return Promise.reject(error);
    }

    const isAuthCall = typeof original?.url === 'string' && /\/auth\/(login|refresh-token|logout)/.test(original.url);
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      let token: string | null;
      try {
        renewing ??= renewSession().finally(() => { renewing = null; });
        token = await renewing;
      } catch {
        return Promise.reject(error); // offline: keep the session, let the screen show its error
      }
      if (token) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
        return api(original);
      }
      await expireSession();
    }
    return Promise.reject(error);
  },
);

let expiring = false;
async function expireSession() {
  if (expiring) return;
  expiring = true;
  try {
    if (onSessionExpired) {
      await onSessionExpired();
    } else {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
    router.replace({ pathname: '/(auth)/login', params: { expired: '1' } } as unknown as Href);
  } finally {
    expiring = false;
  }
}

export default api;
