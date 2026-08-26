import api from './axios';
import { ApiResponse } from '../types';

export interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  type?: string;
  visibility?: string;
  verified?: boolean;
  currentFilename?: string;
  createdAt?: string;
  skills?: Array<{ id: number; name: string }>;
}

export const portfolioApi = {
  byStudent: (studentId: number) =>
    api.get<ApiResponse<PortfolioItem[]>>(`/portfolio/student/${studentId}`),
  create: (body: { studentId?: number; type: string; title: string; description?: string; visibility?: string; skillIds?: number[] }) =>
    api.post<ApiResponse<PortfolioItem>>('/portfolio/items', body),
  verify: (id: number) => api.post<ApiResponse<PortfolioItem>>(`/portfolio/items/${id}/verify`),
  remove: (id: number) => api.delete<ApiResponse<void>>(`/portfolio/items/${id}`),
};
