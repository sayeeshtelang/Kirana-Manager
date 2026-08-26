import api from './api';

export const supplierService = {
  list: () => api.get('/suppliers').then((r) => r.data),
  get: (id) => api.get(`/suppliers/${id}`).then((r) => r.data),
  create: (payload) => api.post('/suppliers', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/suppliers/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/suppliers/${id}`).then((r) => r.data),
};
