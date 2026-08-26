import api from './axios';
import { ApiResponse, PageResponse, Student } from '../types';

export const studentsApi = {
  list: (params?: { page?: number; size?: number; search?: string }) =>
    api.get<ApiResponse<PageResponse<Student>>>('/students', { params }),

  get: (id: number) => api.get<ApiResponse<Student>>(`/students/${id}`),

  byParent: (parentUserId: number) =>
    api.get<ApiResponse<Student[]>>(`/students/by-parent/${parentUserId}`),

  myChildren: () =>
    api.get<ApiResponse<Student[]>>('/parent/children'),

  parents: (studentId: number) =>
    api.get<ApiResponse<any[]>>(`/students/${studentId}/parents`),

  linkParent: (studentId: number, parentId: number) =>
    api.post<ApiResponse<string>>(`/students/${studentId}/parents/${parentId}`),

  unlinkParent: (studentId: number, parentId: number) =>
    api.delete<ApiResponse<string>>(`/students/${studentId}/parents/${parentId}`),
};
