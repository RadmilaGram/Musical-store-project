import { useCallback, useMemo, useState } from "react";
import {
  adminOrderAssign,
  adminOrderCancel,
  adminOrderChangeStatus,
  adminOrderUnassign,
  adminOrderUpdateDelivery,
  adminOrderUpdateInternalComment,
  getAdminOrderDetails,
  getAdminOrderHistory,
} from "../api/orders.api";

const emptyActionState = {
  status: false,
  assignManager: false,
  unassignManager: false,
  assignCourier: false,
  unassignCourier: false,
  cancel: false,
  delivery: false,
  comment: false,
};

export function useAdminOrderDetails({ onAfterAction } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [actionLoading, setActionLoading] = useState(emptyActionState);
  const [actionError, setActionError] = useState(null);

  const hasHistory = useMemo(() => historyLoaded, [historyLoaded]);

  const fetchDetails = useCallback(
    async (targetId = orderId) => {
      if (!targetId) {
        return null;
      }
      setDetailsLoading(true);
      setDetailsError(null);
      try {
        const data = await getAdminOrderDetails(targetId);
        setDetails(data);
        return data;
      } catch (err) {
        setDetailsError(err);
        throw err;
      } finally {
        setDetailsLoading(false);
      }
    },
    [orderId]
  );

  const fetchHistory = useCallback(
    async (targetId = orderId) => {
      if (!targetId) {
        return null;
      }
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const data = await getAdminOrderHistory(targetId);
        const items = Array.isArray(data?.items) ? data.items : [];
        setHistory(items);
        setHistoryLoaded(true);
        return data;
      } catch (err) {
        setHistoryError(err);
        throw err;
      } finally {
        setHistoryLoading(false);
      }
    },
    [orderId]
  );

  const open = useCallback(
    async (targetId) => {
      if (!targetId) {
        return null;
      }
      setIsOpen(true);
      setOrderId(targetId);
      setActionError(null);
      setHistory([]);
      setHistoryLoaded(false);
      return fetchDetails(targetId);
    },
    [fetchDetails]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setOrderId(null);
    setDetails(null);
    setDetailsError(null);
    setHistory([]);
    setHistoryError(null);
    setHistoryLoaded(false);
    setActionError(null);
    setActionLoading(emptyActionState);
  }, []);

  const refreshAfterAction = useCallback(async () => {
    await fetchDetails();
    if (hasHistory) {
      await fetchHistory();
    }
    if (typeof onAfterAction === "function") {
      await onAfterAction();
    }
  }, [fetchDetails, fetchHistory, hasHistory, onAfterAction]);

  const runAction = useCallback(
    async (key, handler) => {
      if (actionLoading[key]) {
        return null;
      }
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      setActionError(null);
      try {
        const result = await handler();
        await refreshAfterAction();
        return result;
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Action failed. Please try again.";
        setActionError(message);
        throw err;
      } finally {
        setActionLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [actionLoading, refreshAfterAction]
  );

  const doChangeStatus = useCallback(
    async (statusId, note) =>
      runAction("status", () =>
        adminOrderChangeStatus(orderId, { statusId, note })
      ),
    [orderId, runAction]
  );

  const doAssign = useCallback(
    async (roleId, userId) => {
      const key = roleId === 3 ? "assignManager" : "assignCourier";
      return runAction(key, () =>
        adminOrderAssign(orderId, { user_role_id: roleId, user_id: userId })
      );
    },
    [orderId, runAction]
  );

  const doUnassign = useCallback(
    async (roleId, note) => {
      const key = roleId === 3 ? "unassignManager" : "unassignCourier";
      return runAction(key, () =>
        adminOrderUnassign(orderId, { user_role_id: roleId, note })
      );
    },
    [orderId, runAction]
  );

  const doCancel = useCallback(
    async (reason) =>
      runAction("cancel", () => adminOrderCancel(orderId, { reason })),
    [orderId, runAction]
  );

  const doUpdateDelivery = useCallback(
    async (payload) =>
      runAction("delivery", () => adminOrderUpdateDelivery(orderId, payload)),
    [orderId, runAction]
  );

  const doUpdateComment = useCallback(
    async (comment_internal) =>
      runAction("comment", () =>
        adminOrderUpdateInternalComment(orderId, { comment_internal })
      ),
    [orderId, runAction]
  );

  return {
    isOpen,
    orderId,
    details,
    detailsLoading,
    detailsError,
    history,
    historyLoading,
    historyError,
    actionLoading,
    actionError,
    open,
    close,
    fetchDetails,
    fetchHistory,
    doChangeStatus,
    doAssign,
    doUnassign,
    doCancel,
    doUpdateDelivery,
    doUpdateComment,
  };
}
