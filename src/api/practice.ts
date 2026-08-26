import api from './axios';
import { ApiResponse } from '../types';

// ── Daily micro-learning ("Daily 5") ─────────────────────────────────────────
export interface PracticeQuestionView {
  id: number;
  orderIndex: number;
  type: string;
  text: string;
  options: string[];
  difficulty: string;
  topicId?: number;
  topicTitle?: string;
  subjectName?: string;
  studentAnswer?: string;
  correct?: boolean | null;
}

export interface PracticeSessionView {
  id: number;
  date: string;
  status: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  currentDifficulty: string;
  model: string;
  pointsAwarded: number;
  alreadyCompleted: boolean;
  questions: PracticeQuestionView[];
}

export interface AnswerFeedback {
  questionId: number;
  correct: boolean;
  correctAnswer?: string;
  explanation?: string;
  masteryBefore: number;
  masteryAfter: number;
  nextDifficulty: string;
  answeredCount: number;
  totalQuestions: number;
  sessionComplete: boolean;
}

export interface SessionSummary {
  sessionId: number;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  pointsAwarded: number;
  xpAwarded: number;
  masteredTopics: string[];
  needsWorkTopics: string[];
  encouragement: string;
  alreadyCompleted: boolean;
}

export interface TopicProgress {
  topicId: number;
  topic: string;
  subject?: string;
  mastery: number;
  attempts: number;
}

export interface PracticeStats {
  sessionsCompleted: number;
  totalAnswered: number;
  totalCorrect: number;
  accuracyPercent: number;
  overallMastery: number;
  topicsTracked: number;
  dueForReview: number;
  weakest: TopicProgress[];
  strongest: TopicProgress[];
}

export const practiceApi = {
  daily: () => api.get<ApiResponse<PracticeSessionView>>('/practice/daily').then((r) => r.data),

  session: (id: number) =>
    api.get<ApiResponse<PracticeSessionView>>(`/practice/sessions/${id}`).then((r) => r.data),

  answer: (sessionId: number, questionId: number, answer: string) =>
    api
      .post<ApiResponse<AnswerFeedback>>(`/practice/sessions/${sessionId}/answer`, { questionId, answer })
      .then((r) => r.data),

  complete: (sessionId: number) =>
    api.post<ApiResponse<SessionSummary>>(`/practice/sessions/${sessionId}/complete`).then((r) => r.data),

  stats: () => api.get<ApiResponse<PracticeStats>>('/practice/stats').then((r) => r.data),

  studentStats: (studentId: number) =>
    api.get<ApiResponse<PracticeStats>>(`/practice/student/${studentId}/stats`).then((r) => r.data),
};
