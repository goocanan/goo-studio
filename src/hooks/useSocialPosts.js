import { useState, useCallback } from "react";
import { SocialPostService } from "../api/social-posts.service.js";

export function useSocialPosts(projectId) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = projectId
        ? await SocialPostService.getByProject(projectId)
        : await SocialPostService.getAll();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createPost = async (payload) => {
    const created = await SocialPostService.create(projectId, payload);
    setPosts((prev) => [...prev, created]);
    return created;
  };

  const updatePost = async (postId, payload) => {
    const updated = await SocialPostService.update(projectId, postId, payload);
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    return updated;
  };

  const deletePost = async (postId) => {
    await SocialPostService.delete(projectId, postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return { posts, loading, error, fetchPosts, createPost, updatePost, deletePost };
}
