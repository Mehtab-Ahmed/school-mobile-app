import api from './axios';
import { ApiResponse, PageResponse } from '../types';

export interface Competition {
  id: number;
  name: string;
  sport: string;
  category?: string;
  status: string;
  competitionDate?: string;
  venue?: string;
  participantCount?: number;
  winnerCount?: number;
}

export interface Winner {
  id: number;
  competitionId?: number;
  competitionName?: string;
  sport?: string;
  position: string;
  studentName?: string;
  teamName?: string;
  medalType?: string;
  trophyName?: string;
  achievementDescription?: string;
  competitionDate?: string;
}

export interface SportsDashboard {
  upcoming: Competition[];
  ongoing: Competition[];
  completed: Competition[];
  recentWinners: Winner[];
}

export interface Achievement {
  competitionName: string;
  sport?: string;
  position: string;
  medalType?: string;
  trophyName?: string;
  competitionDate?: string;
  achievementDescription?: string;
}

export const sportsApi = {
  dashboard: () => api.get<ApiResponse<SportsDashboard>>('/sports/dashboard'),
  recentWinners: () => api.get<ApiResponse<Winner[]>>('/sports/winners/recent'),
  list: (params?: { status?: string; sport?: string; search?: string; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<Competition>>>('/sports/competitions', { params }),
  myAchievements: () => api.get<ApiResponse<Achievement[]>>('/sports/my-achievements'),
  studentAchievements: (studentId: number) =>
    api.get<ApiResponse<Achievement[]>>(`/sports/students/${studentId}/achievements`),
};
