import api from './axios';
import { ApiResponse, AdminDashboard, TeacherDashboard } from '../types';

export const dashboardApi = {
  admin: () => api.get<ApiResponse<AdminDashboard>>('/dashboard/admin'),
  teacher: (teacherId: number) =>
    api.get<ApiResponse<TeacherDashboard>>(`/dashboard/teacher/${teacherId}`),
};
