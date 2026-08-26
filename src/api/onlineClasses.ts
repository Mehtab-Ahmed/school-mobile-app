import api from './axios';
import { ApiResponse } from '../types';

export interface OnlineClass {
  id: number;
  title?: string;
  topic?: string;
  subjectName?: string;
  teacherName?: string;
  status?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  joinUrl?: string;
  provider?: string;
}

export const onlineClassesApi = {
  my: () => api.get<ApiResponse<OnlineClass[]>>('/online-classes/my'),
  join: (id: number) => api.post<ApiResponse<any>>(`/online-classes/${id}/join`),
  leave: (id: number) => api.post<ApiResponse<any>>(`/online-classes/${id}/leave`),
  start: (id: number) => api.post<ApiResponse<OnlineClass>>(`/online-classes/${id}/start`),
  end: (id: number) => api.post<ApiResponse<OnlineClass>>(`/online-classes/${id}/end`),
};
