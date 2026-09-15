import api from './axios';
import { mapData } from './mapResponse';
import { ApiResponse, Homework, HomeworkSubmission } from '../types';

/** Server submission statuses → the three the screens show. */
function screenStatus(s: any): string {
  if (s.status === 'ON_TIME' || s.status === 'LATE') return s.marksObtained != null ? 'GRADED' : 'SUBMITTED';
  return 'PENDING';
}

/** One submission row → a homework item carrying that student's status. */
function toHomework(s: any): Homework & { submissionId: number; submittedAt?: string; grade?: string; remarks?: string } {
  const hw = s.homework ?? {};
  return {
    ...hw,
    submissionId: s.id,
    status: screenStatus(s),
    submittedAt: s.submittedAt ?? undefined,
    grade: s.marksObtained != null ? `${s.marksObtained}${hw.maxMarks ? `/${hw.maxMarks}` : ''}` : undefined,
    remarks: s.feedback ?? undefined,
    teacher: hw.teacher ? { firstName: hw.teacher.firstName, lastName: hw.teacher.lastName } : undefined,
  };
}

export const homeworkApi = {
  /** Homework the student still has to hand in. */
  pending: (studentId: number) =>
    mapData(api.get<ApiResponse<any[]>>(`/homework/student/${studentId}/pending`),
      (rows) => (rows ?? []).filter((s) => s.homework).map(toHomework)),

  /** All of a student's homework with their status — what a parent sees. */
  all: (studentId: number) =>
    mapData(api.get<ApiResponse<any[]>>(`/homework/student/${studentId}/all`),
      (rows) => (rows ?? []).filter((s) => s.homework).map(toHomework)),

  byClass: (classSectionId: number) =>
    api.get<ApiResponse<Homework[]>>(`/homework/class/${classSectionId}`),

  submissions: (homeworkId: number) =>
    api.get<ApiResponse<HomeworkSubmission[]>>(`/homework/${homeworkId}/submissions`),

  create: (payload: {
    title: string;
    description?: string;
    dueDate: string;
    subjectId: number;
    classSectionId: number;
  }) => api.post<ApiResponse<Homework>>('/homework', payload),

  submit: (homeworkId: number, studentId: number, fileUrl?: string) =>
    api.post<ApiResponse<HomeworkSubmission>>(`/homework/${homeworkId}/submit`, { fileUrl }, { params: { studentId } }),

  grade: (submissionId: number, marks: number, feedback?: string) =>
    api.put<ApiResponse<unknown>>(`/homework/submission/${submissionId}/grade`, { marks, feedback }),
};
