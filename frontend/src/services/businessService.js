import api from './api';

export const businessService = {
  getBusiness: () => api.get('/business').then((r) => r.data),
  updateBusiness: (payload) => api.put('/business', payload).then((r) => r.data),
  listMembers: () => api.get('/business/members').then((r) => r.data),
  inviteMember: (payload) => api.post('/business/members/invite', payload).then((r) => r.data),
  acceptInvite: (token) => api.post('/business/members/accept-invite', { token }).then((r) => r.data),
  changeMemberRole: (membershipId, role) => api.patch(`/business/members/${membershipId}/role`, { role }).then((r) => r.data),
  removeMember: (membershipId) => api.delete(`/business/members/${membershipId}`).then((r) => r.data),
};
