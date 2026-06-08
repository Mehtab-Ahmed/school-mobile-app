import api from './axios';
import { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),
};
