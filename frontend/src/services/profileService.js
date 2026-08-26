import api from './api';

export const profileService = {
  update: (formData) => api.put('/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  changePassword: (payload) => api.put('/profile/password', payload).then((r) => r.data),
};
