import { useCallback, useState } from "react";
import { getAdminOrdersList } from "../api/orders.api";

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

  return {
    filters,
    setFilters,
    data,
    loading,
    error,
    refetch,
    applyFilters,
    resetFilters,
  };
}
