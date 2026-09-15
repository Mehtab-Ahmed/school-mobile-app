import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthUser } from '../types';
import api, { setSessionExpiredHandler } from '../api/axios';
import { queryClient } from '../api/queryClient';
import { useChildStore } from './childStore';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  /** Signs out on this phone: ends the session on the server, stops push, clears everything cached. */
  logout: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => Promise<void>;
  hydrate: () => Promise<void>;
}

/** Everything a previous person on this phone could leave behind. */
async function clearLocalSession() {
  await Promise.all([
    SecureStore.deleteItemAsync('accessToken'),
    SecureStore.deleteItemAsync('refreshToken'),
    SecureStore.deleteItemAsync('user'),
    SecureStore.deleteItemAsync('pushToken'),
  ]);
  queryClient.clear();
  useChildStore.setState({ selectedChildId: null });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (user, accessToken, refreshToken) => {
    // Never show one person's cached screens to the next.
    queryClient.clear();
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    const [refreshToken, pushToken] = await Promise.all([
      SecureStore.getItemAsync('refreshToken'),
      SecureStore.getItemAsync('pushToken'),
    ]);
    // Best effort: a sign-out on a phone with no signal still clears the phone.
    await Promise.allSettled([
      api.delete('/auth/push-token', { params: pushToken ? { token: pushToken } : undefined, timeout: 5000 }),
      refreshToken ? api.post('/auth/logout', { refreshToken }, { timeout: 5000 }) : Promise.resolve(),
    ]);
    await clearLocalSession();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: async (partial) => {
    const user = get().user;
    if (!user) return;
    const next = { ...user, ...partial };
    await SecureStore.setItemAsync('user', JSON.stringify(next));
    set({ user: next });
  },

  hydrate: async () => {
    try {
      const [token, refresh, userStr] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('refreshToken'),
        SecureStore.getItemAsync('user'),
      ]);
      if (token && refresh && userStr) {
        set({ user: JSON.parse(userStr) as AuthUser, isAuthenticated: true, isLoading: false });
      } else {
        await clearLocalSession();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

// When the server refuses to renew a session, sign out locally (the server already ended it).
setSessionExpiredHandler(async () => {
  await clearLocalSession();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
