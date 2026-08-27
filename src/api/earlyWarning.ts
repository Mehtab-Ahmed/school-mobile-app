import api from './axios';
import { ApiResponse } from '../types';

export type RiskBand = 'GREEN' | 'AMBER' | 'RED';
export type InterventionStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface DimensionInsight {
  dimension: string;
  label: string;
  value: number;
  cohortMean: number;
  zScore: number;
  classification: string;
  trend: string;
  recommendation: string;
}

export interface WatchlistEntry {
  studentId: number;
  studentName: string;
  className?: string;
  band: RiskBand;
  bandLabel: string;
  riskScore: number;
  reasons: string[];
  openInterventions: number;
  improving: boolean;
}

export interface WatchlistSummary {
  total: number;
  green: number;
  amber: number;
  red: number;
  openInterventions: number;
  studentsWithoutAction: number;
}

export interface Watchlist {
  summary: WatchlistSummary;
  entries: WatchlistEntry[];
}

export interface SuggestedAction {
  focusArea?: string;
  action: string;
  rationale?: string;
}

export interface InterventionView {
  id: number;
  studentId: number;
  studentName?: string;
  action: string;
  notes?: string;
  focusArea?: string;
  ownerUserId?: number;
  ownerName?: string;
  dueDate?: string;
  status: InterventionStatus;
  bandAtStart?: RiskBand;
  riskScoreAtStart?: number;
  riskScoreAtClose?: number;
  riskDelta?: number;
  outcome?: string;
  aiSuggested: boolean;
  createdAt?: string;
  closedAt?: string;
}

export interface StudentRisk {
  studentId: number;
  studentName: string;
  className?: string;
  band: RiskBand;
  bandLabel: string;
  riskScore: number;
  signals: DimensionInsight[];
  strengths: string[];
  focusAreas: string[];
  suggestedActions: SuggestedAction[];
  summary?: string;
  source?: string;
  interventions: InterventionView[];
}

export const earlyWarningApi = {
  watchlist: (band?: RiskBand) =>
    api.get<ApiResponse<Watchlist>>('/early-warning/watchlist', { params: { band } }).then((r) => r.data),

  student: (studentId: number) =>
    api.get<ApiResponse<StudentRisk>>(`/early-warning/student/${studentId}`).then((r) => r.data),

  interventions: (params?: { studentId?: number; openOnly?: boolean; mine?: boolean }) =>
    api.get<ApiResponse<InterventionView[]>>('/early-warning/interventions', { params }).then((r) => r.data),

  create: (body: {
    studentId: number; action: string; notes?: string; focusArea?: string;
    ownerUserId?: number; dueDate?: string; aiSuggested?: boolean;
  }) => api.post<ApiResponse<InterventionView>>('/early-warning/interventions', body).then((r) => r.data),

  update: (id: number, body: {
    status?: InterventionStatus; notes?: string; outcome?: string;
    ownerUserId?: number; dueDate?: string;
  }) => api.put<ApiResponse<InterventionView>>(`/early-warning/interventions/${id}`, body).then((r) => r.data),
};
