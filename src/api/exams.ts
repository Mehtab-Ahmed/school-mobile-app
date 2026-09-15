import api from './axios';
import { mapData } from './mapResponse';
import { ApiResponse, Exam, ExamMark } from '../types';

const label = (s?: string) => (s ?? '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/** Server exams use `type`/`examDate`; the screens read `examType`/`startDate`/`endDate`. */
const toExam = (e: any): Exam => ({
  ...e,
  examType: label(e.type),
  startDate: e.examDate,
  endDate: e.examDate,
});

export const examsApi = {
  list: (params?: { academicYearId?: number; classSectionId?: number }) =>
    mapData(api.get<ApiResponse<any[]>>('/exams', { params }), (list) => (list ?? []).map(toExam)),

  /**
   * A student's results, newest first. Students and parents only receive
   * exams whose results the school has published.
   */
  marks: (studentId: number, examId?: number) =>
    mapData(api.get<ApiResponse<any[]>>(`/exams/student/${studentId}/results`), (rows): ExamMark[] =>
      (rows ?? [])
        .filter((r) => !examId || r.examId === examId)
        .map((r) => ({
          id: r.markId,
          exam: {
            id: r.examId,
            name: r.subjectName ? `${r.examName} · ${r.subjectName}` : r.examName,
            examType: label(r.examType),
            startDate: r.examDate,
            endDate: r.examDate,
            status: r.examStatus,
          } as Exam,
          marksObtained: r.absent ? undefined : r.marksObtained ?? undefined,
          totalMarks: r.totalMarks,
          grade: r.grade,
          remarks: r.absent ? 'Absent' : r.remarks,
        }))),

  /** Overall percentage, grade and per-subject totals for the current year. */
  reportCard: (studentId: number, academicYearId?: number) =>
    api.get<ApiResponse<any>>(`/exams/student/${studentId}/report-card`, { params: { academicYearId } }),

  /** Marks already entered for an exam (staff). */
  classMarks: (examId: number) =>
    api.get<ApiResponse<any[]>>(`/exams/${examId}/marks`),

  saveMarks: (examId: number, data: {
    subjectId: number;
    entries: { studentId: number; marksObtained?: number | null; absent: boolean; remarks?: string }[];
  }) => api.post<ApiResponse<unknown>>(`/exams/${examId}/marks`, data),
};
