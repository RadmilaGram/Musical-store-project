import { useCallback, useState } from "react";
import { getMyOrders, getMyOrderDetails } from "../api/orders.api";

export function useMyOrders() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState({ limit: 20, offset: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const loadMyOrders = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyOrders(params);
      setItems(data?.items ?? []);
      setPage(
        data?.page ?? {
          limit: params.limit ?? 20,
          offset: params.offset ?? 0,
          total: data?.items?.length ?? 0,
        }
      );
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const openOrderDetails = useCallback(async (orderId) => {
    if (!orderId) {
      return null;
    }
    setSelectedOrderId(orderId);
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const data = await getMyOrderDetails(orderId);
      setDetails(data);
      return data;
    } catch (err) {
      setDetailsError(err);
      throw err;
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const closeOrderDetails = useCallback(() => {
    setSelectedOrderId(null);
    setDetails(null);
    setDetailsError(null);
  }, []);

  return {
    items,
    page,
    loading,
    error,
    selectedOrderId,
    details,
    detailsLoading,
    detailsError,
    loadMyOrders,
    openOrderDetails,
    closeOrderDetails,
  };
}
