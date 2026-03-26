import api from './client';

export const SpoolService = {
  getAll: async () => {
    const { data } = await api.get('/spools');
    return data;
  },
  
  create: async (spoolData) => {
    const { data } = await api.post('/spools', spoolData);
    return data;
  },
  
  update: async (id, spoolData) => {
    const { data } = await api.put(`/spools/${id}`, spoolData);
    return data;
  },
  
  delete: async (id) => {
    const { data } = await api.delete(`/spools/${id}`);
    return data;
  },

  adjustWeight: async (id, amount) => {
    const { data } = await api.put(`/spools/${id}/adjust`, { amount });
    return data;
  }
};
