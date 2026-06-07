import api from './axios';
import { ApiResponse, StudentFeeSummary, FeePayment } from '../types';

export const feesApi = {
  studentSummary: (studentId: number) =>
    api.get<ApiResponse<StudentFeeSummary>>(`/fees/student/${studentId}/summary`),

  payments: (studentId: number) =>
    api.get<ApiResponse<FeePayment[]>>(`/fees/student/${studentId}/payments`),

  collect: (payload: {
    studentId: number;
    feeStructureId: number;
    amount: number;
    paymentMethod: string;
  }) => api.post<ApiResponse<FeePayment>>('/fees/collect', payload),
};
