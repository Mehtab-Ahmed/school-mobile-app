import api from './axios';
import { ApiResponse, Exam, ExamMark } from '../types';

export const examsApi = {
  list: (academicYearId?: number) =>
    api.get<ApiResponse<Exam[]>>('/exams', { params: { academicYearId } }),

  marks: (studentId: number, examId?: number) =>
    api.get<ApiResponse<ExamMark[]>>(`/exams/marks/student/${studentId}`, {
      params: examId ? { examId } : {},
    }),
};
