import api from './axios';
import { ApiResponse } from '../types';

export interface PlanItemView {
  id: number;
  date: string;
  orderIndex: number;
  task: string;
  topicTitle?: string;
  topicId?: number;
  subjectName?: string;
  reason: string;
  minutes: number;
  done: boolean;
}

export interface PlanDay {
  date: string;
  dayLabel: string;
  totalMinutes: number;
  doneCount: number;
  items: PlanItemView[];
}

export interface StudyPlanView {
  id: number;
  weekStart: string;
  status: string;
  dailyMinutes: number;
  rationale?: string;
  model: string;
  totalItems: number;
  doneItems: number;
  progressPercent: number;
  days: PlanDay[];
}

export interface PlanDrivers {
  upcomingExams: string[];
  pendingHomework: number;
  weakTopics: string[];
  attendancePercent?: number;
  recentTestAverage?: number;
}

export interface ChallengeView {
  id: number;
  title: string;
  description?: string;
  topicId?: number;
  topicTitle?: string;
  startMastery: number;
  currentMastery: number;
  targetMastery: number;
  progressPercent: number;
  xpReward: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  rewardGranted: boolean;
}

export const studyPlanApi = {
  my: (dailyMinutes?: number) =>
    api.get<ApiResponse<StudyPlanView>>('/study-plan/my', { params: { dailyMinutes } }).then((r) => r.data),

  regenerate: (dailyMinutes?: number) =>
    api.post<ApiResponse<StudyPlanView>>('/study-plan/my/regenerate', { dailyMinutes }).then((r) => r.data),

  drivers: () => api.get<ApiResponse<PlanDrivers>>('/study-plan/my/drivers').then((r) => r.data),

  markItem: (planId: number, itemId: number, done: boolean) =>
    api.put<ApiResponse<StudyPlanView>>(`/study-plan/${planId}/items/${itemId}`, { done }).then((r) => r.data),

  studentPlan: (studentId: number) =>
    api.get<ApiResponse<StudyPlanView>>(`/study-plan/student/${studentId}`).then((r) => r.data),

  challenges: () => api.get<ApiResponse<ChallengeView[]>>('/study-plan/challenges').then((r) => r.data),

  generateChallenges: (count?: number, days?: number) =>
    api.post<ApiResponse<ChallengeView[]>>('/study-plan/challenges/generate', { count, days }).then((r) => r.data),

  challengeHistory: () =>
    api.get<ApiResponse<ChallengeView[]>>('/study-plan/challenges/history').then((r) => r.data),
};
