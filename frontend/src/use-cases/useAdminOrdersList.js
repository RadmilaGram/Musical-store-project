import { useCallback, useEffect, useState } from "react";
import { getAdminOrdersList, getAdminOrderStatuses } from "../api/orders.api";

const emptyFilters = {
  statusId: "",
  clientId: "",
  managerId: "",
  courierId: "",
  dateFrom: "",
  dateTo: "",
};

export function useAdminOrdersList({ initialFilters } = {}) {
  const [filters, setFilters] = useState(() => ({
    ...emptyFilters,
    ...(initialFilters || {}),
  }));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [statusesLoading, setStatusesLoading] = useState(false);
  const [statusesError, setStatusesError] = useState(null);

  const fetchOrders = useCallback(async (nextFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminOrdersList(nextFilters);
      const items = Array.isArray(response) ? response : response?.items ?? [];
      setData(items);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(async () => fetchOrders(filters), [
    fetchOrders,
    filters,
  ]);

  const resetFilters = useCallback(async () => {
    const cleared = { ...emptyFilters };
    setFilters(cleared);
    return fetchOrders(cleared);
  }, [fetchOrders]);

  const refetch = useCallback(async () => fetchOrders(filters), [
    fetchOrders,
    filters,
  ]);

  const loadStatuses = useCallback(async () => {
    setStatusesLoading(true);
    setStatusesError(null);
    try {
      const response = await getAdminOrderStatuses();
      const items = Array.isArray(response) ? response : response?.items ?? [];
      setStatuses(items);
      return response;
    } catch (err) {
      setStatusesError(err);
      throw err;
    } finally {
      setStatusesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatuses().catch(() => {});
  }, [loadStatuses]);

  return {
    filters,
    setFilters,
    data,
    loading,
    error,
    statuses,
    statusesLoading,
    statusesError,
    refetch,
    applyFilters,
    resetFilters,
    loadStatuses,
  };
}
