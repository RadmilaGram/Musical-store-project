import { useCallback, useState } from "react";
import {
  finishCourierOrder,
  getCourierDetails,
  getCourierHistory,
  getCourierMy,
  getCourierQueue,
  takeCourierOrder,
} from "../api/courierOrders.api";

export function useCourierOrders() {
  const [queueOrders, setQueueOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [queuePage, setQueuePage] = useState({ limit: 20, offset: 0, total: 0 });
  const [myPage, setMyPage] = useState({ limit: 20, offset: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const fetchBoth = useCallback(async (options = {}) => {
    const queueOptions = {
      sortBy: options.sortBy,
      sortDir: options.sortDir,
      limit: options.limit,
      offset: options.offset,
    };
    const myOptions = {
      sortBy: options.sortBy,
      sortDir: options.sortDir,
      hideClosed: options.hideClosed,
      limit: options.limit,
      offset: options.offset,
    };
    const [queueData, myData] = await Promise.all([
      getCourierQueue(queueOptions),
      getCourierMy(myOptions),
    ]);
    setQueueOrders(queueData?.items ?? []);
    setQueuePage(queueData?.page ?? { limit: 20, offset: 0, total: 0 });
    setMyOrders(myData?.items ?? []);
    setMyPage(myData?.page ?? { limit: 20, offset: 0, total: 0 });
    return { queue: queueData, my: myData };
  }, []);

  const loadQueue = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourierQueue({
        sortBy: options.sortBy,
        sortDir: options.sortDir,
        limit: options.limit,
        offset: options.offset,
      });
      setQueueOrders(data?.items ?? []);
      setQueuePage(data?.page ?? { limit: 20, offset: 0, total: 0 });
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMy = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourierMy({
        sortBy: options.sortBy,
        sortDir: options.sortDir,
        hideClosed: options.hideClosed,
        limit: options.limit,
        offset: options.offset,
      });
      setMyOrders(data?.items ?? []);
      setMyPage(data?.page ?? { limit: 20, offset: 0, total: 0 });
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      return await fetchBoth(options);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBoth]);

  const takeOrder = useCallback(
    async (orderId, options = {}) => {
      if (!orderId) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        await takeCourierOrder(orderId);
        return await fetchBoth(options);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchBoth]
  );

  const finishOrder = useCallback(
    async (orderId, note, options = {}) => {
      if (!orderId) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await finishCourierOrder(orderId, note);
        await loadMy(options);
        return data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadMy]
  );

  const loadDetails = useCallback(async (orderId) => {
    if (!orderId) {
      return null;
    }
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const data = await getCourierDetails(orderId);
      setDetails(data);
      return data;
    } catch (err) {
      setDetailsError(err);
      throw err;
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (orderId) => {
    if (!orderId) {
      return null;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await getCourierHistory(orderId);
      setHistory(data?.items ?? []);
      return data;
    } catch (err) {
      setHistoryError(err);
      throw err;
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  return {
    queueOrders,
    myOrders,
    queuePage,
    myPage,
    loading,
    error,
    details,
    detailsLoading,
    detailsError,
    history,
    historyLoading,
    historyError,
    loadQueue,
    loadMy,
    refreshAll,
    loadDetails,
    loadHistory,
    takeOrder,
    finishOrder,
  };
}
