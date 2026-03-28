import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SpoolService, UserService } from '../api';
import { calculateStatus } from '../lib/utils';
import { useMemo, useCallback, useState } from 'react';

export function useSpools() {
  const queryClient = useQueryClient();

  const { data: spools = [], isLoading: isLoadingSpools } = useQuery({
    queryKey: ['spools'],
    queryFn: SpoolService.getAll,
  });

  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: UserService.getSettings,
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['userActivity'],
    queryFn: UserService.getActivity,
  });

  // Provide defaults
  const settings = settingsData || {
    lowStockThreshold: 200,

    weightUnit: 'gram'
  };
  const activity = activityData || [];

  // Spool Mutations
  const addSpoolMutation = useMutation({
    mutationFn: SpoolService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      queryClient.invalidateQueries({ queryKey: ['userActivity'] });
    }
  });

  const updateSpoolMutation = useMutation({
    mutationFn: ({ id, updates }) => SpoolService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spools'] })
  });

  const deleteSpoolMutation = useMutation({
    mutationFn: SpoolService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      queryClient.invalidateQueries({ queryKey: ['userActivity'] });
    }
  });

  const adjustWeightMutation = useMutation({
    mutationFn: ({ id, amount }) => SpoolService.adjustWeight(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      queryClient.invalidateQueries({ queryKey: ['userActivity'] });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: UserService.updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userSettings'] })
  });

  const addActivityMutation = useMutation({
    mutationFn: (message) => UserService.logActivity(message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userActivity'] })
  });

  const addActivity = useCallback((message) => {
    addActivityMutation.mutate(message);
  }, [addActivityMutation]);

  const addSpool = useCallback(async (spool) => {
    try {
      return await addSpoolMutation.mutateAsync(spool);
    } catch (e) {
      alert('Error saving filament: ' + (e.response?.data?.error || e.message));
      throw e;
    }
  }, [addSpoolMutation]);

  const updateSpool = useCallback((id, updates) => {
    updateSpoolMutation.mutate({ id, updates });
  }, [updateSpoolMutation]);

  const deleteSpool = useCallback((id) => {
    deleteSpoolMutation.mutate(id);
  }, [deleteSpoolMutation]);

  const adjustWeight = useCallback((id, amount) => {
    adjustWeightMutation.mutate({ id, amount });
  }, [adjustWeightMutation]);

  const updateLocalSettings = useCallback((updates) => {
    updateSettingsMutation.mutate(updates);
  }, [updateSettingsMutation]);

  const resetAll = useCallback(() => {
    // Not safe with backend, just refresh
    window.location.reload();
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify({ spools, settings, activity }, null, 2);
  }, [spools, settings, activity]);

  const importData = useCallback((jsonStr) => {
    try {
      // Stub
      return true;
    } catch {
      return false;
    }
  }, []);

  const processedSpools = useMemo(() => {
    return spools.map(s => {
      // Map inventory fields to existing UI fields
      const mapped = {
        ...s,
        remainingWeight: s.currentWeight,
        material: s.materialType,
        colorName: s.color,
        // Calculate status locally using the item's threshold or the global setting
        status: calculateStatus(
          s.currentWeight, 
          s.initialWeight, 
          s.lowStockThreshold || settings.lowStockThreshold
        )
      };
      return mapped;
    });
  }, [spools, settings.lowStockThreshold]);

  const stats = useMemo(() => {
    return {
      totalSpools: processedSpools.length,
      totalWeight: processedSpools.reduce((sum, s) => sum + (s.remainingWeight || 0), 0),
      lowStockCount: processedSpools.filter(s => s.status === 'low').length,
      uniqueBrands: [...new Set(processedSpools.map(s => s.brand))].length,
      lowStockSpools: processedSpools.filter(s => s.status === 'low' || s.status === 'empty'),
    };
  }, [processedSpools]);

  return {
    spools: processedSpools,
    settings,
    activity,
    stats,
    addSpool,
    updateSpool,
    deleteSpool,
    adjustWeight,
    updateSettings: updateLocalSettings,
    resetAll,
    exportData,
    importData,
    addActivity,
    isLoading: isLoadingSpools || isLoadingSettings || isLoadingActivity
  };
}
