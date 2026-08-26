import api from './api';

export const purchaseOrderService = {
  list: (params) => api.get('/purchase-orders', { params }).then((r) => r.data),
  get: (id) => api.get(`/purchase-orders/${id}`).then((r) => r.data),
  create: (payload) => api.post('/purchase-orders', payload).then((r) => r.data),
  receive: (id) => api.post(`/purchase-orders/${id}/receive`).then((r) => r.data),
  cancel: (id) => api.post(`/purchase-orders/${id}/cancel`).then((r) => r.data),
};
