import api from './api';

export const dashboardService = {
  getSummary: () => api.get('/dashboard').then((r) => r.data),
};
