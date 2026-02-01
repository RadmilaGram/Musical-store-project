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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const fetchBoth = useCallback(async () => {
    const [queueData, myData] = await Promise.all([
      getCourierQueue(),
      getCourierMy(),
    ]);
    setQueueOrders(queueData?.items ?? []);
    setMyOrders(myData?.items ?? []);
    return { queue: queueData, my: myData };
  }, []);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourierQueue();
      setQueueOrders(data?.items ?? []);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourierMy();
      setMyOrders(data?.items ?? []);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await fetchBoth();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBoth]);

  const takeOrder = useCallback(
    async (orderId) => {
      if (!orderId) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        await takeCourierOrder(orderId);
        return await fetchBoth();
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
    async (orderId, note) => {
      if (!orderId) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await finishCourierOrder(orderId, note);
        await loadMy();
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
