import api from './axios';
import { ApiResponse } from '../types';

export interface ParentTransportView {
  studentId: number;
  studentName?: string;
  routeId?: number;
  routeName?: string;
  routeCode?: string;
  stopName?: string;
  tripActive?: boolean;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
  lastBoardedAt?: string;
  lastAlightedAt?: string;
  status?: string;
}

export const transportGpsApi = {
  child: (studentId: number) => api.get<ApiResponse<ParentTransportView>>(`/transport/child/${studentId}`),
  childAttendance: (studentId: number) => api.get<ApiResponse<any[]>>(`/transport/child/${studentId}/attendance`),
  routeStops: (routeId: number) => api.get<ApiResponse<any[]>>(`/transport/routes/${routeId}/stops`),
  liveLocation: (routeId: number) => api.get<ApiResponse<any>>(`/transport/routes/${routeId}/live-location`),
};
