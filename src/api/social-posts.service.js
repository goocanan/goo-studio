import api from './client';

export const SocialPostService = {
  getAll: async () => {
    const { data } = await api.get('/social-posts');
    return data;
  },

  getByProject: async (projectId) => {
    const { data } = await api.get(`/social-posts/project/${projectId}`);
    return data;
  },

  create: async (projectId, postData) => {
    const { data } = await api.post(`/social-posts/project/${projectId}`, postData);
    return data;
  },

  update: async (projectId, postId, postData) => {
    const { data } = await api.put(`/social-posts/project/${projectId}/${postId}`, postData);
    return data;
  },

  delete: async (projectId, postId) => {
    const { data } = await api.delete(`/social-posts/project/${projectId}/${postId}`);
    return data;
  },
};
