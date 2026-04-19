import api from './client';

export const BatchService = {
  getAll: async () => {
    const { data } = await api.get('/batches');
    return data;
  },
  
  create: async (batchData) => {
    const { data } = await api.post('/batches', batchData);
    return data;
  },

  complete: async (id) => {
    const { data } = await api.post(`/batches/${id}/complete`);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/batches/${id}`);
    return data;
  }
};
