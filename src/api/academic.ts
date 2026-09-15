import api from './axios';
import { mapData } from './mapResponse';
import { ApiResponse, ClassSection, TimetableEntry, LeaveApplication, LeaveBalance } from '../types';

/** Server timetable slots → what the timetable screens render. Breaks are left out. */
function toEntries(slots: any[]): TimetableEntry[] {
  return (slots ?? [])
    .filter((s) => !s.isBreak && !s.break)
    .map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: String(s.startTime ?? '').slice(0, 5),
      endTime: String(s.endTime ?? '').slice(0, 5),
      subject: s.subject ?? undefined,
      teacher: s.teacher ? { firstName: s.teacher.firstName, lastName: s.teacher.lastName } : undefined,
      classSection: s.classSection
        ? { ...s.classSection, roomNumber: s.roomNumber ?? s.classSection.roomNumber }
        : undefined,
    }));
}

/** Server leave application → the screen's shape (fromDate/toDate become startDate/endDate). */
function toLeave(a: any): LeaveApplication {
  return {
    id: a.id,
    leaveType: { name: a.leaveType?.name ?? 'Leave' },
    startDate: a.fromDate,
    endDate: a.toDate,
    reason: a.reason,
    status: a.status,
    appliedAt: a.createdAt,
    totalDays: a.numDays,
  };
}

export const academicApi = {
  classSections: () =>
    api.get<ApiResponse<ClassSection[]>>('/class-sections'),

  timetable: (classSectionId: number) =>
    mapData(api.get<ApiResponse<any[]>>(`/timetable/class/${classSectionId}`), toEntries),

  /** The signed-in student's class timetable, or a teacher's own periods. */
  myTimetable: () =>
    mapData(api.get<ApiResponse<any[]>>('/timetable/my'), toEntries),

  /** Timetables are keyed by the teacher's user id. */
  teacherTimetable: (teacherUserId: number) =>
    mapData(api.get<ApiResponse<any[]>>(`/timetable/teacher/${teacherUserId}`), toEntries),
};

export const leavesApi = {
  types: () =>
    api.get<ApiResponse<{ id: number; name: string; maxDaysPerYear: number; active: boolean }[]>>('/leaves/types'),

  myApplications: () =>
    mapData(api.get<ApiResponse<any[]>>('/leaves/mine'), (list) => (list ?? []).map(toLeave)),

  balances: () =>
    mapData(api.get<ApiResponse<any[]>>('/leaves/balance'), (list): LeaveBalance[] =>
      (list ?? []).map((b) => ({
        leaveTypeName: b.leaveType?.name ?? 'Leave',
        totalLeaves: b.totalDays,
        usedLeaves: b.usedDays,
        remainingLeaves: b.totalDays - b.usedDays,
      }))),

  apply: (payload: {
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    reason: string;
  }) => api.post<ApiResponse<LeaveApplication>>('/leaves/apply', {
    leaveTypeId: payload.leaveTypeId,
    fromDate: payload.startDate,
    toDate: payload.endDate,
    reason: payload.reason,
  }),

  pending: () =>
    mapData(api.get<ApiResponse<{ content: any[] }>>('/leaves', { params: { status: 'PENDING', size: 50 } }),
      (page) => (page?.content ?? []).map(toLeave)),

  approve: (id: number, remarks?: string) =>
    api.post<ApiResponse<unknown>>(`/leaves/${id}/review`, { action: 'APPROVED', remarks }),

  reject: (id: number, remarks?: string) =>
    api.post<ApiResponse<unknown>>(`/leaves/${id}/review`, { action: 'REJECTED', remarks }),
};
