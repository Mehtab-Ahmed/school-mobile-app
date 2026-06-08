import api from './axios';

export const eventsApi = {
  list: (from?: string, to?: string) => api.get('/events', { params: { from, to } }),
  create: (data: any) => api.post('/events', data),
  update: (id: number, data: any) => api.put(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
};

export const lmsApi = {
  list: (params?: any) => api.get('/lms/materials', { params }),
  create: (data: any) => api.post('/lms/materials', data),
  delete: (id: number) => api.delete(`/lms/materials/${id}`),
  toggleBookmark: (id: number) => api.post(`/lms/materials/${id}/bookmark`),
  myBookmarks: () => api.get('/lms/my-bookmarks'),
};

export const healthApi = {
  getMedicalRecord: (studentId: number) => api.get(`/health/student/${studentId}`),
  updateMedicalRecord: (studentId: number, data: any) => api.put(`/health/student/${studentId}`, data),
  getIncidents: (params?: any) => api.get('/health/incidents', { params }),
  reportIncident: (data: any) => api.post('/health/incidents', data),
  resolveIncident: (id: number, actionTaken: string) => api.put(`/health/incidents/${id}/resolve`, { actionTaken }),
};

export const certificatesApi = {
  getMy: () => api.get('/certificates/my'),
  getForStudent: (studentId: number) => api.get(`/certificates/student/${studentId}`),
  issue: (data: any) => api.post('/certificates/issue', data),
};

export const ptmApi = {
  requestMeeting: (data: any) => api.post('/ptm/meetings', data),
  confirmMeeting: (id: number, data: any) => api.put(`/ptm/meetings/${id}/confirm`, data),
  completeMeeting: (id: number, notes: string) => api.put(`/ptm/meetings/${id}/complete`, { teacherNotes: notes }),
  cancelMeeting: (id: number) => api.put(`/ptm/meetings/${id}/cancel`),
  getMyMeetings: () => api.get('/ptm/meetings'),
  submitFeedback: (data: any) => api.post('/ptm/feedback', data),
};

export const challengesApi = {
  getActive: () => api.get('/gamification/challenges/active'),
  getMyProgress: () => api.get('/gamification/challenges/my-progress'),
  getXPLevels: () => api.get('/gamification/xp-levels'),
  getMyLevel: () => api.get('/gamification/my-level'),
};

export const teacherPerformanceApi = {
  getMy: () => api.get('/teacher-performance/my'),
  getLeaderboard: () => api.get('/teacher-performance/leaderboard'),
  recalculate: () => api.post('/teacher-performance/recalculate'),
};
// Alias used by screens
export const teacherPerfApi = teacherPerformanceApi;

export const academicIntelligenceApi = {
  getStudentPerformance: (studentId: number) =>
    api.get(`/academic-intelligence/student/${studentId}/performance`),
  getAtRisk: (status?: string) =>
    api.get('/academic-intelligence/at-risk', { params: { status } }),
  createAtRisk: (data: any) => api.post('/academic-intelligence/at-risk', data),
  resolveAtRisk: (id: number, notes?: string) =>
    api.put(`/academic-intelligence/at-risk/${id}/resolve`, { notes }),
  dismissAtRisk: (id: number) =>
    api.put(`/academic-intelligence/at-risk/${id}/dismiss`),
  // legacy alias
  resolveFlag: (id: number) => api.put(`/academic-intelligence/at-risk/${id}/resolve`),
};
// Alias used by screens
export const academicIntelApi = academicIntelligenceApi;

export const feeInstallmentsApi = {
  getStudentInstallments: (studentId: number) =>
    api.get(`/fees/installments/student/${studentId}`),
  getMyInstallments: () => api.get('/fees/installments/my'),
  getMy: () => api.get('/fees/installments/my'),
  payInstallment: (id: number, data?: any) =>
    api.post(`/fees/installments/${id}/pay`, data ?? {}),
};
