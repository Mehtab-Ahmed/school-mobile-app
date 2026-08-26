import api from './axios';
import { ApiResponse, Student } from '../types';

export interface ChildSummary extends Partial<Student> {
  id: number;
  studentId?: number;
  fullName?: string;
  studentName?: string;
  admissionNumber?: string;
  className?: string;
  sectionName?: string;
}

export interface ChildOverview {
  studentId: number;
  attendancePercentage?: number;
  presentDays?: number;
  totalDays?: number;
  pendingHomework?: number;
  overdueFees?: number;
  feeBalance?: number;
  latestMarks?: Array<{ subject?: string; marks?: number; totalMarks?: number; grade?: string }>;
  behaviorRemarks?: number;
  achievements?: number;
}

export interface DigestView {
  id: number;
  studentId: number;
  digestType: string;
  period: string;
  title?: string;
  summary?: string;
  createdAt?: string;
}

export const parentApi = {
  children: () => api.get<ApiResponse<ChildSummary[]>>('/parent/children'),
  overview: (studentId: number) => api.get<ApiResponse<ChildOverview>>(`/parent/child/${studentId}/overview`),
  digests: () => api.get<ApiResponse<DigestView[]>>('/parent/digests'),
  generateDigest: (studentId: number, type: 'WEEKLY' | 'MONTHLY' = 'WEEKLY') =>
    api.post<ApiResponse<any>>(`/parent/child/${studentId}/digest`, undefined, { params: { type } }),
};
