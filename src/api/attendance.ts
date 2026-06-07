import api from './axios';
import { ApiResponse, AttendanceRecord, AttendanceSummary } from '../types';

export const attendanceApi = {
  getStudents: (classSectionId: number, date: string) =>
    api.get<ApiResponse<AttendanceRecord[]>>('/attendance/students', {
      params: { classSectionId, date },
    }),

  mark: (payload: {
    classSectionId: number;
    date: string;
    attendanceRecords: { studentId: number; status: string; remarks?: string }[];
  }) => api.post<ApiResponse<unknown>>('/attendance/mark', payload),

  summary: (studentId: number, from: string, to: string) =>
    api.get<ApiResponse<AttendanceSummary>>(`/attendance/summary/${studentId}`, {
      params: { from, to },
    }),

  myAttendance: (studentId: number, month: number, year: number) =>
    api.get<ApiResponse<AttendanceRecord[]>>(`/attendance/student/${studentId}`, {
      params: { month, year },
    }),
};
