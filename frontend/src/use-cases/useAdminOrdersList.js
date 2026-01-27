import { useCallback, useEffect, useState } from "react";
import {
  getAdminCouriers,
  getAdminManagers,
  getAdminOrderCounters,
  getAdminOrdersList,
  getAdminOrderStatuses,
} from "../api/orders.api";

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
  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [managersError, setManagersError] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [couriersLoading, setCouriersLoading] = useState(false);
  const [couriersError, setCouriersError] = useState(null);
  const [counters, setCounters] = useState({
    byStatus: {},
    byManager: {},
    byCourier: {},
  });
  const [countersLoading, setCountersLoading] = useState(false);
  const [countersError, setCountersError] = useState(null);

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

  const loadManagers = useCallback(async () => {
    setManagersLoading(true);
    setManagersError(null);
    try {
      const response = await getAdminManagers();
      const items = Array.isArray(response) ? response : response?.items ?? [];
      setManagers(items);
      return response;
    } catch (err) {
      setManagersError(err);
      throw err;
    } finally {
      setManagersLoading(false);
    }
  }, []);

  const loadCouriers = useCallback(async () => {
    setCouriersLoading(true);
    setCouriersError(null);
    try {
      const response = await getAdminCouriers();
      const items = Array.isArray(response) ? response : response?.items ?? [];
      setCouriers(items);
      return response;
    } catch (err) {
      setCouriersError(err);
      throw err;
    } finally {
      setCouriersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManagers().catch(() => {});
    loadCouriers().catch(() => {});
  }, [loadManagers, loadCouriers]);

  const loadCounters = useCallback(async () => {
    setCountersLoading(true);
    setCountersError(null);
    try {
      const response = await getAdminOrderCounters();
      const payload =
        response && typeof response === "object"
          ? response
          : { byStatus: {}, byManager: {}, byCourier: {} };
      setCounters({
        byStatus: payload.byStatus || {},
        byManager: payload.byManager || {},
        byCourier: payload.byCourier || {},
      });
      return response;
    } catch (err) {
      setCountersError(err);
      throw err;
    } finally {
      setCountersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCounters().catch(() => {});
  }, [loadCounters]);

  return {
    filters,
    setFilters,
    data,
    loading,
    error,
    statuses,
    statusesLoading,
    statusesError,
    managers,
    managersLoading,
    managersError,
    couriers,
    couriersLoading,
    couriersError,
    counters,
    countersLoading,
    countersError,
    refetch,
    applyFilters,
    resetFilters,
    loadStatuses,
    loadManagers,
    loadCouriers,
    loadCounters,
  };
}
