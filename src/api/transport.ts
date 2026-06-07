import api from './axios';

export const transportApi = {
  studentTransport: (studentId: number) =>
    api.get(`/transport/student/${studentId}`).then(r => r.data),
  routes: () => api.get('/transport/routes').then(r => r.data),
  stops: (routeId: number) =>
    api.get(`/transport/routes/${routeId}/stops`).then(r => r.data),
  myRoute: () => api.get('/transport/driver/my-route').then(r => r.data),
  myStops: () => api.get('/transport/driver/my-route/stops').then(r => r.data),
};
