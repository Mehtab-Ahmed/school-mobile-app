import api from './axios';
import { mapData } from './mapResponse';
import { ApiResponse, StudentFeeSummary, FeePayment } from '../types';

/** What is still owed on one due after its concession and late fee. */
const outstanding = (p: any) =>
  Math.max(0, Number(p?.amountDue ?? 0) - Number(p?.discount ?? 0) + Number(p?.lateFee ?? 0) - Number(p?.amountPaid ?? 0));

/** The server's fee "demand" reshaped for the fee screens. */
function toPayment(p: any): FeePayment {
  return {
    id: p.id,
    receiptNumber: p.receiptNumber ?? '',
    amount: Number(p.amountDue ?? 0) - Number(p.discount ?? 0) + Number(p.lateFee ?? 0),
    paidAmount: Number(p.amountPaid ?? 0),
    dueAmount: outstanding(p),
    dueDate: p.dueDate,
    paymentDate: p.paymentDate ?? p.dueDate,
    paymentMethod: p.paymentMode ?? undefined,
    status: p.status,
    period: p.remarks && !String(p.remarks).startsWith('Waived') ? p.remarks : undefined,
    feeCategory: { name: p.feeStructure?.feeCategory?.name ?? p.feeStructure?.feeType ?? 'Fee' },
  };
}

export const feesApi = {
  studentSummary: (studentId: number) =>
    mapData(api.get<ApiResponse<any>>(`/fees/student/${studentId}/summary`), (s): StudentFeeSummary => {
      const rows: any[] = s?.payments ?? [];
      return {
        studentId: s?.studentId ?? studentId,
        studentName: s?.studentName ?? '',
        totalFee: Number(s?.totalFee ?? 0),
        totalPaid: Number(s?.totalPaid ?? 0),
        totalBalance: Number(s?.totalDue ?? 0),
        overdueAmount: rows.filter((p) => p.status === 'OVERDUE').reduce((sum, p) => sum + outstanding(p), 0),
        payments: rows.map(toPayment),
      };
    }),

  payments: (studentId: number) =>
    mapData(api.get<ApiResponse<any[]>>(`/fees/student/${studentId}/payments`), (rows): FeePayment[] => (rows ?? []).map(toPayment)),

  collect: (payload: {
    studentId: number;
    feeStructureId: number;
    amount: number;
    paymentMethod: string;
  }) => api.post<ApiResponse<FeePayment>>('/fees/collect', payload),
};
