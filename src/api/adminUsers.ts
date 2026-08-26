import api from './axios';
import { ApiResponse, PageResponse, UserRole } from '../types';

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  loginId?: string;
  role: UserRole;
  active?: boolean;
  tempPassword?: string;
}

export const adminUsersApi = {
  list: (params?: { role?: UserRole; search?: string; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<AdminUser>>>('/admin/users', { params }),
  create: (body: { firstName: string; lastName: string; email?: string; phoneNumber?: string; password?: string; role: UserRole }) =>
    api.post<ApiResponse<AdminUser>>('/admin/users', body),
  update: (id: number, body: Partial<AdminUser> & { password?: string }) =>
    api.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, body),
  resetPassword: (id: number) =>
    api.patch<ApiResponse<{ loginId: string; tempPassword: string }>>(`/admin/users/${id}/reset-password`),
};
