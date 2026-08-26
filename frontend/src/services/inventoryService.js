import api from './api';

export const inventoryService = {
  adjust: (payload) => api.post('/inventory/adjust', payload).then((r) => r.data),
  listMovements: (params) => api.get('/inventory/movements', { params }).then((r) => r.data),
  listLowStock: () => api.get('/inventory/low-stock').then((r) => r.data),
};
