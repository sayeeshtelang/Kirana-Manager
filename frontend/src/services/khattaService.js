import api from './api';

export const khattaService = {
  listOutstanding: () => api.get('/khatta/outstanding').then((r) => r.data),
  getLedger: (customerId) => api.get(`/khatta/${customerId}/ledger`).then((r) => r.data),
  repay: (customerId, payload) => api.post(`/khatta/${customerId}/repay`, payload).then((r) => r.data),
};
