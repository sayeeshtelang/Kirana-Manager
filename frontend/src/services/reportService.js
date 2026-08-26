import api from './api';

export const reportService = {
  sales: (params) => api.get('/reports/sales', { params }).then((r) => r.data),
  products: (params) => api.get('/reports/products', { params }).then((r) => r.data),
  paymentMethods: (params) => api.get('/reports/payment-methods', { params }).then((r) => r.data),
};
