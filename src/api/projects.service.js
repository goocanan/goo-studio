import api from './client';

export const ProjectService = {
  getAll: async () => {
    const { data } = await api.get('/projects');
    return data;
  },
  
  create: async (projectData) => {
    const { data } = await api.post('/projects', projectData);
    return data;
  },
  
  update: async (id, projectData) => {
    const { data } = await api.put(`/projects/${id}`, projectData);
    return data;
  },
  
  delete: async (id) => {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },

  addPart: async (projectId, partData) => {
    const { data } = await api.post(`/projects/${projectId}/parts`, partData);
    return data;
  },

  updatePart: async (projectId, partId, partData) => {
    const { data } = await api.put(`/projects/${projectId}/parts/${partId}`, partData);
    return data;
  },

  deletePart: async (projectId, partId) => {
    const { data } = await api.delete(`/projects/${projectId}/parts/${partId}`);
    return data;
  }
};
