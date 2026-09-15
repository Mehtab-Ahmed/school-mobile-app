import api from './axios';
import { mapData } from './mapResponse';
import { ApiResponse, AttendanceRecord, AttendanceSummary } from '../types';

/** What the register needs besides the roster: which sitting it is and whether it can be edited. */
export interface MarkingSheetMeta {
  className?: string;
  session?: string;
  timetableSlotId?: number | null;
  subjectName?: string | null;
  editable: boolean;
  readOnlyReason?: string | null;
}

const toScreenStatus = (s?: string): AttendanceRecord['status'] =>
  s === 'ON_LEAVE' ? 'EXCUSED' : ((s as AttendanceRecord['status']) ?? 'PRESENT');

const toServerStatus = (s: string) => (s === 'EXCUSED' ? 'ON_LEAVE' : s);

const iso = (d: Date) => d.toISOString().split('T')[0];

export const attendanceApi = {
  /**
   * The register for a class and date. The server works out the sitting for the
   * school's attendance mode; `sheet` carries it so saving marks the same one.
   */
  getStudents: async (classSectionId: number, date: string) => {
    const res = await api.get<ApiResponse<any>>('/attendance/sheet', { params: { classSectionId, date } });
    const sheet = res.data?.data;
    const records: AttendanceRecord[] = (sheet?.students ?? []).map((s: any) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      admissionNumber: s.admissionNumber ?? s.rollNumber ?? '',
      status: toScreenStatus(s.status),
    }));
    const meta: MarkingSheetMeta = {
      className: sheet?.className,
      session: sheet?.session,
      timetableSlotId: sheet?.timetableSlotId,
      subjectName: sheet?.subjectName,
      editable: sheet?.editable ?? true,
      readOnlyReason: sheet?.readOnlyReason,
    };
    return { ...res, data: { ...res.data, data: records, sheet: meta } };
  },

  mark: (payload: {
    classSectionId: number;
    date: string;
    session?: string;
    timetableSlotId?: number | null;
    attendanceRecords: { studentId: number; status: string; remarks?: string }[];
  }) => api.post<ApiResponse<unknown>>('/attendance/students', {
    classSectionId: payload.classSectionId,
    date: payload.date,
    session: payload.session,
    timetableSlotId: payload.timetableSlotId ?? undefined,
    // Students on approved leave keep that record; teachers can only mark present, late or absent.
    entries: payload.attendanceRecords
      .filter((r) => r.status !== 'EXCUSED')
      .map((r) => ({ ...r, status: toServerStatus(r.status) })),
  }),

  summary: (studentId: number, from: string, to: string) =>
    mapData(api.get<ApiResponse<any>>(`/attendance/students/${studentId}/summary`, { params: { from, to } }),
      (s): AttendanceSummary => ({ ...s, halfDays: s?.halfDays ?? 0 })),

  myAttendance: (studentId: number, month: number, year: number) =>
    api.get<ApiResponse<AttendanceRecord[]>>(`/attendance/students/${studentId}`, {
      params: { from: iso(new Date(year, month - 1, 1)), to: iso(new Date(year, month, 0)) },
    }),
};
