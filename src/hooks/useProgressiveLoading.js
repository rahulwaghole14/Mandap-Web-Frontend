import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for progressive loading of dashboard data
 * Loads critical data first, then secondary data
 */
export const useProgressiveLoading = () => {
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    recentMembers: true,
    associations: true,
    monthlyData: true,
    topAssociations: true
  });

  const [errors, setErrors] = useState({
    stats: null,
    recentMembers: null,
    associations: null,
    monthlyData: null,
    topAssociations: null
  });

  const [data, setData] = useState({
    stats: null,
    recentMembers: null,
    associations: null,
    monthlyData: null,
    topAssociations: null
  });

  // Update loading state for a specific section
  const setLoading = useCallback((section, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [section]: isLoading
    }));
  }, []);

  // Update error state for a specific section
  const setError = useCallback((section, error) => {
    setErrors(prev => ({
      ...prev,
      [section]: error
    }));
  }, []);

  // Update data for a specific section
  const setDataForSection = useCallback((section, sectionData) => {
    setData(prev => ({
      ...prev,
      [section]: sectionData
    }));
  }, []);

  // Check if any critical data is still loading
  const isCriticalDataLoading = loadingStates.stats || loadingStates.recentMembers;

  // Check if any secondary data is still loading
  const isSecondaryDataLoading = loadingStates.associations || loadingStates.monthlyData || loadingStates.topAssociations;

  // Check if all data is loaded
  const isAllDataLoaded = !Object.values(loadingStates).some(loading => loading);

  // Check if there are any errors
  const hasErrors = Object.values(errors).some(error => error !== null);

  // Get critical data loading progress (0-100)
  const getCriticalProgress = useCallback(() => {
    const criticalSections = ['stats', 'recentMembers'];
    const loadedCount = criticalSections.filter(section => !loadingStates[section]).length;
    return (loadedCount / criticalSections.length) * 100;
  }, [loadingStates]);

  // Get overall loading progress (0-100)
  const getOverallProgress = useCallback(() => {
    const allSections = Object.keys(loadingStates);
    const loadedCount = allSections.filter(section => !loadingStates[section]).length;
    return (loadedCount / allSections.length) * 100;
  }, [loadingStates]);

  // Reset all states
  const reset = useCallback(() => {
    setLoadingStates({
      stats: true,
      recentMembers: true,
      associations: true,
      monthlyData: true,
      topAssociations: true
    });
    setErrors({
      stats: null,
      recentMembers: null,
      associations: null,
      monthlyData: null,
      topAssociations: null
    });
    setData({
      stats: null,
      recentMembers: null,
      associations: null,
      monthlyData: null,
      topAssociations: null
    });
  }, []);

  return {
    loadingStates,
    errors,
    data,
    setLoading,
    setError,
    setDataForSection,
    isCriticalDataLoading,
    isSecondaryDataLoading,
    isAllDataLoaded,
    hasErrors,
    getCriticalProgress,
    getOverallProgress,
    reset
  };
};

export default useProgressiveLoading;
