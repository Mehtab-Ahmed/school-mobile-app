import api from './axios';
import { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  login: (identifier: string, password: string, tenantId?: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email: identifier,
      password,
      tenantId: tenantId?.trim() || undefined,
    }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh-token', { refreshToken }),

  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),

  /** Ends every session for this account on success, so the caller should sign in again. */
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse<void>>('/auth/change-password', { currentPassword, newPassword }),
};
