import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SocialPostService } from "../api/social-posts.service.js";
import { useCallback } from "react";

export function useSocialPosts(projectId) {
  const queryClient = useQueryClient();

  const queryKey = projectId
    ? ["socialPosts", projectId]
    : ["socialPosts", "all"];

  const {
    data: posts = [],
    isLoading: loading,
    error: queryError,
    refetch: fetchPosts,
  } = useQuery({
    queryKey,
    queryFn: () =>
      projectId
        ? SocialPostService.getByProject(projectId)
        : SocialPostService.getAll(),
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const error = queryError?.response?.data?.error || queryError?.message || null;

  const createPostMutation = useMutation({
    mutationFn: (payload) => SocialPostService.create(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["socialPosts", "all"] });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, payload }) =>
      SocialPostService.update(projectId, postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["socialPosts", "all"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => SocialPostService.delete(projectId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["socialPosts", "all"] });
    },
  });

  const createPost = useCallback(
    async (payload) => createPostMutation.mutateAsync(payload),
    [createPostMutation]
  );

  const updatePost = useCallback(
    async (postId, payload) =>
      updatePostMutation.mutateAsync({ postId, payload }),
    [updatePostMutation]
  );

  const deletePost = useCallback(
    async (postId) => deletePostMutation.mutateAsync(postId),
    [deletePostMutation]
  );

  return { posts, loading, error, fetchPosts, createPost, updatePost, deletePost };
}
