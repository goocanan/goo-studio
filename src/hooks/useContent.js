import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export function useContent() {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const { data: contents = [], isLoading } = useQuery({
    queryKey: ['contents'],
    queryFn: async () => {
      const { data } = await api.get('/contents');
      return data;
    }
  });

  const createContentMutation = useMutation({
    mutationFn: async (contentData) => {
      const { data } = await api.post('/contents', contentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
    onError: (err) => setError(err.message)
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/contents/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
    onError: (err) => setError(err.message)
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/contents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
    onError: (err) => setError(err.message)
  });

  return {
    contents,
    isLoading,
    error,
    createContent: (data) => createContentMutation.mutateAsync(data),
    updateContent: (id, data) => updateContentMutation.mutateAsync({ id, data }),
    deleteContent: (id) => deleteContentMutation.mutateAsync(id),
  };
}
