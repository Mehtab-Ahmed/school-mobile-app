import api from './axios';
import { ApiResponse } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PointSummary {
  studentId: number;
  totalPoints: number;
  assignmentPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
  sportsPoints: number;
  activityPoints: number;
  leadershipPoints: number;
  classRank?: number;
  schoolRank?: number;
  streakDays: number;
}

export interface Badge {
  id: number;
  badge: {
    id: number;
    name: string;
    description: string;
    iconUrl?: string;
    badgeType: string;
    category: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  };
  earnedAt: string;
  note?: string;
}

export interface BadgeDefinition {
  id: number;
  name: string;
  description: string;
  iconUrl?: string;
  badgeType: string;
  category: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  triggerType: string;
  triggerValue?: number;
  pointsReward: number;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  totalPoints: number;
  assignmentPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
  streakDays: number;
  classRank?: number;
  schoolRank?: number;
}

export interface MyGamification {
  summary: PointSummary;
  badges: Badge[];
  badgeCount: number;
}

export interface BehaviorRemark {
  id: number;
  studentId: number;
  teacherId: number;
  remarkType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  category: string;
  title: string;
  description?: string;
  severity: number;
  pointsImpact: number;
  visibleToParent: boolean;
  resolved: boolean;
  createdAt: string;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const gamificationApi = {
  // Leaderboard
  getClassLeaderboard: (classSectionId: number) =>
    api.get<ApiResponse<LeaderboardEntry[]>>(`/gamification/leaderboard/class/${classSectionId}`),

  getSchoolLeaderboard: (limit = 50) =>
    api.get<ApiResponse<LeaderboardEntry[]>>(`/gamification/leaderboard/school?limit=${limit}`),

  // Student data
  getMy: () =>
    api.get<ApiResponse<MyGamification>>('/gamification/my'),

  getStudentSummary: (studentId: number) =>
    api.get<ApiResponse<PointSummary>>(`/gamification/student/${studentId}/summary`),

  getStudentBadges: (studentId: number) =>
    api.get<ApiResponse<Badge[]>>(`/gamification/student/${studentId}/badges`),

  // Badge catalog
  getAllBadges: () =>
    api.get<ApiResponse<BadgeDefinition[]>>('/gamification/badges'),

  // Manual award (admin/teacher)
  awardPoints: (studentId: number, points: number, category: string, description: string) =>
    api.post('/gamification/points/award', { studentId, points, category, description }),
};

// ── Behavior API ───────────────────────────────────────────────────────────

export const behaviorApi = {
  addRemark: (data: {
    studentId: number;
    remarkType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    category: string;
    title: string;
    description?: string;
    severity?: number;
    pointsImpact: number;
    visibleToParent?: boolean;
  }) => api.post<ApiResponse<BehaviorRemark>>('/behavior/remarks', data),

  getStudentRemarks: (studentId: number) =>
    api.get<ApiResponse<BehaviorRemark[]>>(`/behavior/student/${studentId}`),

  resolveRemark: (id: number) =>
    api.put<ApiResponse<BehaviorRemark>>(`/behavior/remarks/${id}/resolve`),
};
