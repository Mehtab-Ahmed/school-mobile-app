import api from './axios';
import { ApiResponse } from '../types';

export type InstitutionType = 'SCHOOL' | 'COLLEGE' | 'UNIVERSITY' | 'COACHING';
export type LevelType = 'GRADE' | 'SEMESTER' | 'YEAR';
export type CurriculumStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CurriculumSource = 'MANUAL' | 'CSV_IMPORT' | 'AI_IMPORT' | 'CLONED';

export interface CurriculumView {
  id: number;
  name: string;
  institutionType: InstitutionType;
  board?: string;
  levelType: LevelType;
  levelNumber?: number;
  gradeId?: number;
  gradeName?: string;
  academicYearId?: number;
  levelLabel: string;
  unitLabel: string;
  status: CurriculumStatus;
  source: CurriculumSource;
  description?: string;
  unitCount: number;
  topicCount: number;
}

export interface TopicView {
  id: number;
  unitId: number;
  title: string;
  sequence: number;
  description?: string;
  learningObjectives?: string;
  difficulty?: string;
  estimatedMinutes?: number;
}

export interface UnitView {
  id: number;
  subjectId: number;
  subjectName?: string;
  title: string;
  unitCode?: string;
  sequence: number;
  expectedWeeks?: number;
  description?: string;
  topics: TopicView[];
}

export interface SubjectGroup {
  subjectId: number;
  subjectName: string;
  units: UnitView[];
}

export interface CurriculumTree {
  curriculum: CurriculumView;
  subjects: SubjectGroup[];
}

export interface CsvImportResult {
  unitsCreated: number;
  topicsCreated: number;
  rowsProcessed: number;
  warnings: string[];
  errors: string[];
}

export interface DraftTopic {
  title: string;
  sequence?: number;
  description?: string;
  learningObjectives?: string;
  difficulty?: string;
}

export interface DraftUnit {
  subjectId?: number;
  subjectName?: string;
  title: string;
  unitCode?: string;
  sequence?: number;
  topics: DraftTopic[];
}

export interface AiDraftResult {
  model: string;
  units: DraftUnit[];
  notice: string;
}

export const curriculumApi = {
  list: () => api.get<ApiResponse<CurriculumView[]>>('/curriculum').then((r) => r.data),

  tree: (id: number) => api.get<ApiResponse<CurriculumTree>>(`/curriculum/${id}/tree`).then((r) => r.data),

  create: (body: {
    name: string; institutionType?: InstitutionType; board?: string;
    levelType?: LevelType; levelNumber?: number; gradeId?: number;
    academicYearId?: number; levelLabel?: string; unitLabel?: string; description?: string;
  }) => api.post<ApiResponse<CurriculumView>>('/curriculum', body).then((r) => r.data),

  publish: (id: number) => api.post<ApiResponse<CurriculumView>>(`/curriculum/${id}/publish`).then((r) => r.data),
  archive: (id: number) => api.post<ApiResponse<CurriculumView>>(`/curriculum/${id}/archive`).then((r) => r.data),
  clone: (id: number, body?: { name?: string; academicYearId?: number; gradeId?: number }) =>
    api.post<ApiResponse<CurriculumView>>(`/curriculum/${id}/clone`, body ?? {}).then((r) => r.data),
  remove: (id: number) => api.delete<ApiResponse<string>>(`/curriculum/${id}`).then((r) => r.data),

  addUnit: (id: number, body: { subjectId: number; title: string; unitCode?: string; sequence?: number }) =>
    api.post<ApiResponse<UnitView>>(`/curriculum/${id}/units`, body).then((r) => r.data),
  deleteUnit: (unitId: number) => api.delete<ApiResponse<string>>(`/curriculum/units/${unitId}`).then((r) => r.data),
  addTopic: (unitId: number, body: { title: string; difficulty?: string; learningObjectives?: string }) =>
    api.post<ApiResponse<TopicView>>(`/curriculum/units/${unitId}/topics`, body).then((r) => r.data),
  deleteTopic: (topicId: number) => api.delete<ApiResponse<string>>(`/curriculum/topics/${topicId}`).then((r) => r.data),

  importCsv: (id: number, csv: string) =>
    api.post<ApiResponse<CsvImportResult>>(`/curriculum/${id}/import/csv`, { csv }).then((r) => r.data),

  aiDraft: (id: number, body: { rawText: string; subjectId?: number; subjectHint?: string }) =>
    api.post<ApiResponse<AiDraftResult>>(`/curriculum/${id}/import/ai`, body).then((r) => r.data),

  commitDraft: (id: number, units: DraftUnit[], replaceExisting = false) =>
    api.post<ApiResponse<CsvImportResult>>(`/curriculum/${id}/import/commit`, { units, replaceExisting }).then((r) => r.data),

  templateUrl: '/api/v1/curriculum/import/template',
};
