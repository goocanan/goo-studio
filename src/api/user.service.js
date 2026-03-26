import api from './client';

export const UserService = {
  getSettings: async () => {
    const { data } = await api.get('/user/settings');
    return data;
  },
  
  updateSettings: async (settings) => {
    const { data } = await api.put('/user/settings', settings);
    return data;
  },

  getActivity: async () => {
    const { data } = await api.get('/user/activity');
    return data;
  },

  logActivity: async (message) => {
    const { data } = await api.post('/user/activity', { message });
    return data;
  }
};
