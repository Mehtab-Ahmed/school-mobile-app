import api from './axios';
import { ApiResponse, Homework, HomeworkSubmission } from '../types';

export const homeworkApi = {
  pending: (studentId: number) =>
    api.get<ApiResponse<Homework[]>>(`/homework/pending/${studentId}`),

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

  submit: (homeworkId: number, studentId: number) =>
    api.post<ApiResponse<HomeworkSubmission>>(`/homework/${homeworkId}/submit/${studentId}`, {}),
};
