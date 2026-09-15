import api from './axios';
import { mapData } from './mapResponse';
import { ApiResponse, AdminDashboard, TeacherDashboard } from '../types';

export const dashboardApi = {
  admin: () => api.get<ApiResponse<AdminDashboard>>('/dashboard/admin'),

  /** Always the signed-in teacher's own dashboard. */
  teacher: () =>
    mapData(api.get<ApiResponse<any>>('/dashboard/teacher'), (d): TeacherDashboard => ({
      teacherName: d?.teacherName ?? '',
      totalClasses: d?.myClasses?.length ?? 0,
      totalStudents: d?.totalStudentsUnderMe ?? 0,
      pendingMarkEntries: d?.pendingMarkEntries ?? 0,
      unreadMessages: d?.unreadMessages ?? 0,
      myClasses: d?.myClasses ?? [],
      pendingAttendanceClasses: d?.pendingAttendanceClasses ?? [],
    })),
};
