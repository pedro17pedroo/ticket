import { useEffect, useState } from 'react';
import useOrganizationStore from '../store/organizationStore';

const useOrganizations = (autoFetch = true) => {
  const {
    organizations,
    selectedOrganization,
    loading,
    error,
    fetchOrganizations,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    suspendOrganization,
    activateOrganization,
    clearSelectedOrganization,
    clearError
  } = useOrganizationStore();

  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (autoFetch) {
      fetchOrganizations(filters);
    }
  }, [autoFetch, filters]);

  const refresh = () => {
    return fetchOrganizations(filters);
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  return {
    organizations,
    selectedOrganization,
    loading,
    error,
    fetchOrganizations,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    suspendOrganization,
    activateOrganization,
    clearSelectedOrganization,
    clearError,
    refresh,
    applyFilters
  };
};

export default useOrganizations;
