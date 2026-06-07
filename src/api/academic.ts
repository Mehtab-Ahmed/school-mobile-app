import api from './axios';
import { ApiResponse, ClassSection, TimetableEntry, LeaveApplication, LeaveBalance } from '../types';

export const academicApi = {
  classSections: () =>
    api.get<ApiResponse<ClassSection[]>>('/academic/class-sections'),

  timetable: (classSectionId: number) =>
    api.get<ApiResponse<TimetableEntry[]>>(`/academic/timetable/${classSectionId}`),

  teacherTimetable: (teacherId: number) =>
    api.get<ApiResponse<TimetableEntry[]>>(`/academic/timetable/teacher/${teacherId}`),
};

export const leavesApi = {
  myApplications: () =>
    api.get<ApiResponse<LeaveApplication[]>>('/leaves/my-applications'),

  balances: () =>
    api.get<ApiResponse<LeaveBalance[]>>('/leaves/balances/my'),

  apply: (payload: {
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    reason: string;
  }) => api.post<ApiResponse<LeaveApplication>>('/leaves/apply', payload),

  pending: () =>
    api.get<ApiResponse<LeaveApplication[]>>('/leaves/pending'),

  approve: (id: number, remarks?: string) =>
    api.put<ApiResponse<unknown>>(`/leaves/${id}/approve`, { remarks }),

  reject: (id: number, remarks?: string) =>
    api.put<ApiResponse<unknown>>(`/leaves/${id}/reject`, { remarks }),
};
