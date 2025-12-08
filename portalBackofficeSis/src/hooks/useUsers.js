import { useEffect, useState } from 'react';
import useUserStore from '../store/userStore';

const useUsers = (autoFetch = true) => {
  const {
    users,
    selectedUser,
    loading,
    error,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    deactivateUser,
    clearSelectedUser,
    clearError
  } = useUserStore();

  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (autoFetch) {
      fetchUsers(filters);
    }
  }, [autoFetch, filters]);

  const refresh = () => {
    return fetchUsers(filters);
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  return {
    users,
    selectedUser,
    loading,
    error,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    deactivateUser,
    clearSelectedUser,
    clearError,
    refresh,
    applyFilters
  };
};

export default useUsers;
