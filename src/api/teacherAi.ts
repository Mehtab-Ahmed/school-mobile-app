import api from './axios';
import { ApiResponse } from '../types';

export type LessonPlanStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LessonPlanSource = 'MANUAL' | 'AI_GENERATED' | 'PDF_IMPORT';

export interface Flashcard { front: string; back: string }
export interface Mcq { question: string; options: string[]; answer: string; explanation?: string }
export interface PlanStep { heading: string; detail: string; minutes?: number }

export interface LessonPlanContent {
  learningObjectives?: string[];
  introduction?: string;
  explanation?: PlanStep[];
  examples?: string[];
  classActivity?: string;
  quiz?: Mcq[];
  homework?: string;
  assessmentCriteria?: string[];
  materials?: string[];
  commonMistakes?: string[];
}

export interface LessonPlanView {
  id: number;
  title: string;
  curriculumId?: number;
  unitId?: number;
  topicId?: number;
  subjectId?: number;
  subjectName?: string;
  classSectionId?: number;
  durationMinutes?: number;
  status: LessonPlanStatus;
  source: LessonPlanSource;
  model: string;
  edited: boolean;
  content?: LessonPlanContent;
  createdAt?: string;
}

export interface StudyPack {
  summary?: string;
  keyPoints: string[];
  notes: string[];
  flashcards: Flashcard[];
  questions: Mcq[];
  homework: string[];
  model: string;
  notice?: string;
}

export interface ClassWeakness {
  topicId: number;
  topic: string;
  subjectName?: string;
  averageMastery: number;
  studentsTracked: number;
  studentsStruggling: number;
}

export interface WeaknessReport {
  classSectionId: number;
  className?: string;
  weakTopics: ClassWeakness[];
  questions: Mcq[];
  model: string;
  notice?: string;
}

export const teacherAiApi = {
  generatePlan: (body: {
    unitId?: number; topicId?: number; subjectId?: number; classSectionId?: number;
    title?: string; topicText?: string; durationMinutes?: number;
  }) => api.post<ApiResponse<LessonPlanView>>('/teacher-ai/lesson-plans/generate', body).then((r) => r.data),

  listPlans: (mine = true) =>
    api.get<ApiResponse<LessonPlanView[]>>('/teacher-ai/lesson-plans', { params: { mine } }).then((r) => r.data),

  getPlan: (id: number) =>
    api.get<ApiResponse<LessonPlanView>>(`/teacher-ai/lesson-plans/${id}`).then((r) => r.data),

  updatePlan: (id: number, body: { title?: string; content?: LessonPlanContent }) =>
    api.put<ApiResponse<LessonPlanView>>(`/teacher-ai/lesson-plans/${id}`, body).then((r) => r.data),

  publishPlan: (id: number) =>
    api.post<ApiResponse<LessonPlanView>>(`/teacher-ai/lesson-plans/${id}/publish`).then((r) => r.data),

  deletePlan: (id: number) =>
    api.delete<ApiResponse<string>>(`/teacher-ai/lesson-plans/${id}`).then((r) => r.data),

  studyPack: (body: { rawText: string; subjectHint?: string; gradeHint?: number; parts?: string[] }) =>
    api.post<ApiResponse<StudyPack>>('/teacher-ai/study-pack', body).then((r) => r.data),

  /**
   * React Native has no browser File object - a picked document arrives as
   * { uri, name, mimeType }, which RN's FormData accepts directly.
   *
   * Note: picking the PDF needs expo-document-picker, which is not a dependency
   * yet, so no screen calls this today. It is here so wiring a picker later is a
   * one-line change rather than an API rewrite.
   */
  studyPackPdf: (file: { uri: string; name: string; mimeType?: string }, subjectHint?: string) => {
    const fd = new FormData();
    fd.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'application/pdf',
    } as unknown as Blob);
    const params = subjectHint ? { subjectHint } : undefined;
    return api.post<ApiResponse<StudyPack>>('/teacher-ai/study-pack/pdf', fd, {
      params, headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  weakness: (body: { classSectionId: number; subjectId?: number; topicCount?: number; questionsPerTopic?: number; difficulty?: string }) =>
    api.post<ApiResponse<WeaknessReport>>('/teacher-ai/weakness-questions', body).then((r) => r.data),

  /** topicId links the pushed questions straight to a syllabus topic, so the
   *  resulting test answers feed that topic's mastery with no name matching. */
  pushToTest: (body: { testId: number; questions: Mcq[]; topic?: string; topicId?: number }) =>
    api.post<ApiResponse<{ added: number }>>('/teacher-ai/push-to-test', body).then((r) => r.data),
};
