import api from './axios';
import { mapData } from './mapResponse';
import { ApiResponse } from '../types';

export interface ParentTransportView {
  studentId: number;
  studentName?: string;
  routeId?: number;
  routeName?: string;
  /** Shown under the route name — the bus registration number. */
  routeCode?: string;
  vehicleNumber?: string;
  driverName?: string;
  stopName?: string;
  dropStopName?: string;
  tripActive?: boolean;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
  lastBoardedAt?: string;
  lastAlightedAt?: string;
  status?: string;
}

export const transportGpsApi = {
  /** A child's bus: the server's field names mapped to what the tracking screen shows. */
  child: (studentId: number) =>
    mapData(api.get<ApiResponse<any>>(`/transport/child/${studentId}`), (v): ParentTransportView | null => v ? ({
      ...v,
      routeCode: v.vehicleNumber ?? undefined,
      stopName: v.pickupStopName ?? v.dropStopName ?? undefined,
      dropStopName: v.dropStopName ?? undefined,
      latitude: v.busLatitude ?? undefined,
      longitude: v.busLongitude ?? undefined,
      locationUpdatedAt: v.busUpdatedAt ?? undefined,
      status: v.todayStatus ?? undefined,
    }) : null),
  childAttendance: (studentId: number) => api.get<ApiResponse<any[]>>(`/transport/child/${studentId}/attendance`),
  routeStops: (routeId: number) => api.get<ApiResponse<any[]>>(`/transport/routes/${routeId}/stops`),
  liveLocation: (routeId: number) => api.get<ApiResponse<any>>(`/transport/routes/${routeId}/live-location`),
};
