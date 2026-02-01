import { useCallback, useState } from "react";
import {
  cancelManagerOrder,
  getManagerMy,
  getManagerOrderDetails,
  getManagerOrderHistory,
  getManagerQueue,
  markReady,
  takeOrder,
} from "../api/orders.api";

export function useManagerOrders() {
  const [queue, setQueue] = useState([]);
  const [my, setMy] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchBoth = useCallback(async () => {
    const [queueData, myData] = await Promise.all([
      getManagerQueue(),
      getManagerMy(),
    ]);
    setQueue(queueData?.items ?? []);
    setMy(myData?.items ?? []);
    return { queue: queueData, my: myData };
  }, []);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getManagerQueue();
      setQueue(data?.items ?? []);
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
      const data = await getManagerMy();
      setMy(data?.items ?? []);
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

  const take = useCallback(
    async (orderId) => {
      if (!orderId) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        await takeOrder(orderId);
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

  const markReadyOrder = useCallback(
    async (orderId, note) => {
      if (!orderId) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        await markReady(orderId, note);
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

  const loadDetails = useCallback(async (orderId) => {
    if (!orderId) {
      return null;
    }
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const data = await getManagerOrderDetails(orderId);
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
      const data = await getManagerOrderHistory(orderId);
      setHistory(data?.items ?? []);
      return data;
    } catch (err) {
      setHistoryError(err);
      throw err;
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(
    async (orderId, reason) => {
      if (!orderId) {
        return null;
      }
      setCancelLoading(true);
      setCancelError(null);
      try {
        const data = await cancelManagerOrder(orderId, reason);
        await fetchBoth();
        return data;
      } catch (err) {
        setCancelError(err);
        throw err;
      } finally {
        setCancelLoading(false);
      }
    },
    [fetchBoth]
  );

  return {
    queue,
    my,
    loading,
    error,
    details,
    detailsLoading,
    detailsError,
    history,
    historyLoading,
    historyError,
    cancelLoading,
    cancelError,
    loadQueue,
    loadMy,
    refreshAll,
    loadDetails,
    loadHistory,
    cancelOrder,
    takeOrder: take,
    markReady: markReadyOrder,
  };
}
