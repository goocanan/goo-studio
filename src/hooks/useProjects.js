import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectService, BatchService } from '../api';
import { PART_STATUSES, PROJECT_STATUSES } from '../lib/constants';
import { groupPartsByColorMaterial } from '../lib/utils';
import { useMemo, useCallback } from 'react';

export function useProjects() {
  const queryClient = useQueryClient();

  // Queries
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: ProjectService.getAll,
  });

  const { data: batches = [], isLoading: isLoadingBatches } = useQuery({
    queryKey: ['batches'],
    queryFn: BatchService.getAll,
  });

  // Project Mutations
  const addProjectMutation = useMutation({
    mutationFn: ProjectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['userActivity'] });
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }) => ProjectService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: ProjectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['userActivity'] });
    }
  });

  // Part Mutations
  const addPartMutation = useMutation({
    mutationFn: ({ projectId, part }) => ProjectService.addPart(projectId, part),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const updatePartMutation = useMutation({
    mutationFn: ({ projectId, partId, updates }) => ProjectService.updatePart(projectId, partId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const deletePartMutation = useMutation({
    mutationFn: ({ projectId, partId }) => ProjectService.deletePart(projectId, partId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  // Batch Mutations
  const createBatchMutation = useMutation({
    mutationFn: BatchService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['userActivity'] });
    }
  });

  const completeBatchMutation = useMutation({
    mutationFn: BatchService.complete,
    onSuccess: (_, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      queryClient.invalidateQueries({ queryKey: ['userActivity'] });
      const batch = batches.find(b => b.id === batchId);
      if (batch && adjustSpoolWeight && batch.spoolId) {
        // Backend now handles adjusting spool weight securely inside completeBatch.
        // So we don't need to manually call adjustSpoolWeight from frontend!
      }
    }
  });

  // Wrappers to maintain existing interface
  const addProject = useCallback(async (project) => {
    return await addProjectMutation.mutateAsync(project);
  }, [addProjectMutation]);

  const updateProject = useCallback((id, updates) => {
    updateProjectMutation.mutate({ id, updates });
  }, [updateProjectMutation]);

  const deleteProject = useCallback((id) => {
    deleteProjectMutation.mutate(id);
  }, [deleteProjectMutation]);

  const addPart = useCallback((projectId, part) => {
    addPartMutation.mutate({ projectId, part });
  }, [addPartMutation]);

  const updatePart = useCallback((projectId, partId, updates) => {
    updatePartMutation.mutate({ projectId, partId, updates });
  }, [updatePartMutation]);

  const deletePart = useCallback((projectId, partId) => {
    deletePartMutation.mutate({ projectId, partId });
  }, [deletePartMutation]);

  const suggestedGroups = useMemo(() => {
    return groupPartsByColorMaterial(projects);
  }, [projects]);

  const createBatch = useCallback(async (group, spoolId) => {
    const payload = {
      material: group.material,
      color: group.color,
      partIds: group.parts.map(p => p.id),
      totalWeight: group.totalWeight,
      spoolId: spoolId
    };
    return await createBatchMutation.mutateAsync(payload);
  }, [createBatchMutation]);

  const completeBatch = useCallback((batchId) => {
    completeBatchMutation.mutate(batchId);
  }, [completeBatchMutation]);

  const stats = useMemo(() => {
    const totalParts = projects.reduce((sum, p) => sum + (p.parts?.length || 0), 0);
    const doneParts = projects.reduce((sum, p) => sum + (p.parts?.filter(pt => pt.status === PART_STATUSES.DONE).length || 0), 0);
    const activeProjects = projects.filter(p => [PROJECT_STATUSES.IDEA, PROJECT_STATUSES.READY, PROJECT_STATUSES.PRINTING].includes(p.status)).length;
    const pendingWeight = suggestedGroups.reduce((sum, g) => sum + (Number(g.totalWeight) || 0), 0);

    return {
      totalProjects: projects.length,
      activeProjects,
      totalParts,
      doneParts,
      completionRate: totalParts > 0 ? Math.round((doneParts / totalParts) * 100) : 0,
      pendingWeight,
      activeBatches: batches.filter(b => b.status === 'ready' || b.status === 'printing').length
    };
  }, [projects, batches, suggestedGroups]);

  return {
    projects,
    batches,
    suggestedGroups,
    stats,
    addProject,
    updateProject,
    deleteProject,
    addPart,
    updatePart,
    deletePart,
    createBatch,
    completeBatch,
    isLoading: isLoadingProjects || isLoadingBatches
  };
}

