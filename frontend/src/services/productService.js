import api from './api';

export const productService = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id, formData) => api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};
