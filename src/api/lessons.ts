import api from './axios';
import { ApiResponse } from '../types';

export type LessonStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'HOLIDAY';

export interface LessonSessionView {
  id: number;
  slotId?: number;
  slotNumber?: number;
  subjectId?: number;
  subjectName?: string;
  classSectionId?: number;
  className?: string;
  teacherId?: number;
  teacherName?: string;
  roomNumber?: string;
  startTime?: string;
  endTime?: string;
  status: LessonStatus;
  actualStart?: string;
  actualEnd?: string;
  onlineClassId?: number;
  journalDone?: boolean;
}

export interface TeacherToday {
  current: LessonSessionView | null;
  sessions: LessonSessionView[];
  pendingJournals: number;
}

export interface StudentToday {
  current: LessonSessionView | null;
  next: LessonSessionView | null;
  sessions: LessonSessionView[];
  remaining: number;
}

export interface JournalView {
  sessionId?: number;
  topicCovered?: string;
  description?: string;
  conceptsTaught?: string;
  homeworkText?: string;
  assignmentText?: string;
  additionalNotes?: string;
  completionPct?: number;
}

export interface SummaryView {
  sessionId: number;
  generated: boolean;
  edited: boolean;
  published: boolean;
  summary?: {
    overview?: string;
    keyConcepts?: string[];
    revisionBullets?: string[];
    practiceQuestions?: string[];
    quiz?: Array<{ question: string; options: string[]; answer?: string; explanation?: string }>;
  };
}

export interface RevisionLesson {
  sessionId: number;
  date: string;
  slotNumber?: number;
  subjectName?: string;
  topicCovered?: string;
  description?: string;
  homeworkText?: string;
  hasSummary?: boolean;
  summaryOverview?: string;
  revisionBullets?: string[];
}

export interface EndOfDaySummary {
  date: string;
  lessons: RevisionLesson[];
  tomorrow: Array<{ subjectName: string; startTime: string; endTime: string; teacherName?: string; roomNumber?: string }>;
  homeworkCount: number;
}

export interface StudentTest {
  testId: number;
  title: string;
  type: string;
  subjectId?: number;
  chapter?: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  attemptsUsed: number;
  attemptsLeft: number;
  scheduledAt?: string;
  status: string;
}

export const lessonsApi = {
  teacherToday: () => api.get<ApiResponse<TeacherToday>>('/lessons/today/teacher'),
  studentToday: () => api.get<ApiResponse<StudentToday>>('/lessons/today/student'),
  start: (id: number) => api.post<ApiResponse<LessonSessionView>>(`/lessons/${id}/start`),
  end: (id: number) => api.post<ApiResponse<LessonSessionView>>(`/lessons/${id}/end`),
  cancel: (id: number) => api.post<ApiResponse<LessonSessionView>>(`/lessons/${id}/cancel`),
  getJournal: (id: number) => api.get<ApiResponse<JournalView>>(`/lessons/${id}/journal`),
  saveJournal: (id: number, body: Partial<JournalView>) => api.put<ApiResponse<JournalView>>(`/lessons/${id}/journal`, body),
  generateSummary: (id: number) => api.post<ApiResponse<SummaryView>>(`/lessons/${id}/summary/generate`),
  getSummary: (id: number) => api.get<ApiResponse<SummaryView>>(`/lessons/${id}/summary`),
  publishSummary: (id: number) => api.post<ApiResponse<SummaryView>>(`/lessons/${id}/summary/publish`),
};

export const revisionApi = {
  list: (scope: 'today' | 'week' | 'range' = 'week', params?: { from?: string; to?: string; subjectId?: number; search?: string }) =>
    api.get<ApiResponse<RevisionLesson[]>>('/revision', { params: { scope, ...params } }),
  endOfDay: () => api.get<ApiResponse<EndOfDaySummary>>('/revision/end-of-day'),
};

export const testsApi = {
  available: () => api.get<ApiResponse<StudentTest[]>>('/tests/available'),
};
