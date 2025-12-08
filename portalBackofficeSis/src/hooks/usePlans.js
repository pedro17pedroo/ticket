import { useState, useEffect } from 'react';
import planService from '../services/planService';

const usePlans = (autoFetch = true) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlans = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planService.getAll(params);
      setPlans(data.plans || []);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchPlan = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planService.getById(id);
      setSelectedPlan(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planService.create(planData);
      setPlans((prev) => [...prev, data]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (id, planData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planService.update(id, planData);
      setPlans((prev) =>
        prev.map((plan) => (plan.id === id ? data : plan))
      );
      if (selectedPlan?.id === id) {
        setSelectedPlan(data);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await planService.delete(id);
      setPlans((prev) => prev.filter((plan) => plan.id !== id));
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const activatePlan = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planService.activate(id);
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === id ? { ...plan, isActive: true } : plan
        )
      );
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deactivatePlan = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planService.deactivate(id);
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === id ? { ...plan, isActive: false } : plan
        )
      );
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearSelectedPlan = () => {
    setSelectedPlan(null);
  };

  const clearError = () => {
    setError(null);
  };

  const refresh = () => {
    return fetchPlans();
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPlans();
    }
  }, [autoFetch]);

  return {
    plans,
    selectedPlan,
    loading,
    error,
    fetchPlans,
    fetchPlan,
    createPlan,
    updatePlan,
    deletePlan,
    activatePlan,
    deactivatePlan,
    clearSelectedPlan,
    clearError,
    refresh
  };
};

export default usePlans;
