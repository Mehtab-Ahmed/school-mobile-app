import api from './axios';
import { ApiResponse, PageResponse, Student } from '../types';

export const studentsApi = {
  list: (params?: { page?: number; size?: number; search?: string }) =>
    api.get<ApiResponse<PageResponse<Student>>>('/students', { params }),

  get: (id: number) => api.get<ApiResponse<Student>>(`/students/${id}`),

  byParent: (parentUserId: number) =>
    api.get<ApiResponse<Student[]>>(`/students/by-parent/${parentUserId}`),
};
