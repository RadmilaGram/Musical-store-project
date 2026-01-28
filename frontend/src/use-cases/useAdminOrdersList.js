import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const defaultPage = {
  limit: 20,
  offset: 0,
  total: 0,
};

export function useAdminOrdersList({ initialFilters } = {}) {
  const [filters, setFilters] = useState(() => ({
    ...emptyFilters,
    ...(initialFilters || {}),
  }));
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    ...emptyFilters,
    ...(initialFilters || {}),
  }));
  const [data, setData] = useState([]);
  const [page, setPage] = useState(defaultPage);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
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
  const debounceTimerRef = useRef(null);

  const draftFilters = useMemo(
    () => ({
      ...filters,
      q,
    }),
    [filters, q]
  );

  const appliedSnapshot = useMemo(
    () => ({
      ...appliedFilters,
      q: appliedQ,
    }),
    [appliedFilters, appliedQ]
  );

  const hasFilterDiff = useMemo(() => {
    const keys = Object.keys(draftFilters);
    return keys.some((key) => draftFilters[key] !== appliedSnapshot[key]);
  }, [draftFilters, appliedSnapshot]);

  const fetchOrders = useCallback(async (options = {}) => {
    const {
      filters: nextFilters = appliedFilters,
      limit = page.limit,
      offset = page.offset,
      sortBy: nextSortBy = sortBy,
      sortDir: nextSortDir = sortDir,
      q: nextQ = appliedQ,
    } = options;
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminOrdersList({
        ...nextFilters,
        limit,
        offset,
        sortBy: nextSortBy,
        sortDir: nextSortDir,
        q: nextQ,
      });
      const items = Array.isArray(response) ? response : response?.items ?? [];
      const nextPage = response?.page || { ...defaultPage, limit, offset };
      setData(items);
      setPage({
        limit: nextPage.limit ?? limit,
        offset: nextPage.offset ?? offset,
        total: nextPage.total ?? 0,
      });
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, appliedQ, page.limit, page.offset, sortBy, sortDir]);

  const loadCounters = useCallback(async (options = {}) => {
    const { filters: nextFilters = appliedFilters, q: nextQ = appliedQ } =
      options;
    setCountersLoading(true);
    setCountersError(null);
    try {
      const response = await getAdminOrderCounters({
        ...nextFilters,
        q: nextQ,
      });
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
  }, [appliedFilters, appliedQ]);

  const resetFilters = useCallback(() => {
    const cleared = { ...emptyFilters };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setQ("");
    setAppliedQ("");
    setPage((prev) => ({ ...prev, offset: 0 }));
  }, []);

  const refetch = useCallback(
    async () => {
      await loadCounters({
        filters: appliedFilters,
        q: appliedQ,
      });
      return fetchOrders({
        filters: appliedFilters,
        limit: page.limit,
        offset: page.offset,
        sortBy,
        sortDir,
        q: appliedQ,
      });
    },
    [
      fetchOrders,
      loadCounters,
      appliedFilters,
      appliedQ,
      page.limit,
      page.offset,
      sortBy,
      sortDir,
    ]
  );

  const onPageChange = useCallback((nextOffset) => {
    setPage((prev) => ({ ...prev, offset: nextOffset }));
  }, []);

  const onRowsPerPageChange = useCallback((nextLimit) => {
    setPage((prev) => ({ ...prev, limit: nextLimit, offset: 0 }));
  }, []);

  const onSortChange = useCallback((nextSortBy) => {
    const isSame = sortBy === nextSortBy;
    const nextDir = isSame ? (sortDir === "asc" ? "desc" : "asc") : "asc";
    setSortBy(nextSortBy);
    setSortDir(nextDir);
    setPage((prev) => ({ ...prev, offset: 0 }));
  }, [sortBy, sortDir]);

  const onSearchChange = useCallback((value) => {
    setQ(value);
  }, []);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!hasFilterDiff) {
      return;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setAppliedFilters(filters);
      setAppliedQ(q);
      setPage((prev) => (prev.offset === 0 ? prev : { ...prev, offset: 0 }));
      debounceTimerRef.current = null;
    }, 350);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [filters, q, hasFilterDiff]);

  useEffect(() => {
    loadCounters({
      filters: appliedFilters,
      q: appliedQ,
    }).catch(() => {});
    fetchOrders({
      filters: appliedFilters,
      limit: page.limit,
      offset: page.offset,
      sortBy,
      sortDir,
      q: appliedQ,
    }).catch(() => {});
  }, [
    appliedFilters,
    appliedQ,
    page.limit,
    page.offset,
    sortBy,
    sortDir,
    loadCounters,
    fetchOrders,
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

  return {
    filters,
    setFilters,
    data,
    page,
    sortBy,
    sortDir,
    q,
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
    resetFilters,
    onPageChange,
    onRowsPerPageChange,
    onSortChange,
    onSearchChange,
    loadStatuses,
    loadManagers,
    loadCouriers,
    loadCounters,
  };
}
