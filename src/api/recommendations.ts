import api from './axios';
import { ApiResponse } from '../types';

export interface RecommendationRun {
  id?: number;
  studentId?: number;
  riskLevel?: string;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  generatedAt?: string;
}

export const recommendationsApi = {
  student: (studentId: number) =>
    api.get<ApiResponse<RecommendationRun>>(`/recommendations/student/${studentId}`),
  generate: (studentId: number) =>
    api.post<ApiResponse<RecommendationRun>>(`/recommendations/student/${studentId}/generate`),
};
