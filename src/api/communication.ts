import api from './axios';
import { mapData } from './mapResponse';
import { ApiResponse, Announcement, Notification } from '../types';

export const communicationApi = {
  announcements: (audience?: string) =>
    api.get<ApiResponse<Announcement[]>>('/communication/announcements/active', {
      params: audience ? { targetAudience: audience } : {},
    }),

  /** The newest 50 of the signed-in user's notifications. */
  notifications: () =>
    mapData(api.get<ApiResponse<{ content: any[] }>>('/notifications/my', { params: { size: 50 } }),
      (page): Notification[] => (page?.content ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.body ?? '',
        type: n.type,
        read: !!n.read,
        createdAt: n.sentAt,
      }))),

  unreadCount: () =>
    api.get<ApiResponse<number>>('/notifications/unread-count'),

  markRead: (id: number) =>
    api.put<ApiResponse<unknown>>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.put<ApiResponse<unknown>>('/notifications/mark-all-read'),
};
