import api from './axios';
import { ApiResponse, Announcement, Notification } from '../types';

export const communicationApi = {
  announcements: (audience?: string) =>
    api.get<ApiResponse<Announcement[]>>('/communication/announcements/active', {
      params: audience ? { targetAudience: audience } : {},
    }),

  notifications: () =>
    api.get<ApiResponse<Notification[]>>('/communication/notifications/my'),

  markRead: (id: number) =>
    api.put<ApiResponse<unknown>>(`/communication/notifications/${id}/read`),
};
