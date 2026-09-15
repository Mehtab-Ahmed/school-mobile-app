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

  /** Sends a 6-digit reset code by SMS/email; never reveals whether the account exists. */
  forgotPassword: (tenantId: string, identifier: string) =>
    api.post<ApiResponse<{ codeDeliveryAvailable: boolean }>>('/auth/forgot-password', { tenantId, identifier }),

  resetPassword: (tenantId: string, identifier: string, code: string, newPassword: string) =>
    api.post<ApiResponse<void>>('/auth/reset-password', { tenantId, identifier, code, newPassword }),

  acceptConsent: () => api.post<ApiResponse<{ version: string }>>('/auth/consent'),

  requestDeletion: (reason?: string) => api.post<ApiResponse<void>>('/auth/deletion-request', { reason }),

  /** Ends every session for this account on success, so the caller should sign in again. */
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse<void>>('/auth/change-password', { currentPassword, newPassword }),
};
