import api from './api';

export const billService = {
  list: (params) => api.get('/bills', { params }).then((r) => r.data),
  get: (id) => api.get(`/bills/${id}`).then((r) => r.data),
  create: (payload) => api.post('/bills', payload).then((r) => r.data),
  void: (id, reason) => api.post(`/bills/${id}/void`, { reason }).then((r) => r.data),
};
