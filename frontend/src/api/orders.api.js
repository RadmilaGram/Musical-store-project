import { apiClient } from "./axiosInstance";

export async function getMyOrders() {
  const { data } = await apiClient.get("/api/orders/my", {
    withCredentials: true,
  });
  return data;
}

export async function getMyOrderDetails(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.get(`/api/orders/my/${orderId}`, {
    withCredentials: true,
  });
  return data;
}

export async function cancelMyOrder(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.patch(`/api/orders/${orderId}/status`, {
    status: "canceled",
  });
  return data;
}

export async function getManagerQueue() {
  const { data } = await apiClient.get("/api/orders/manager/queue", {
    withCredentials: true,
  });
  return data;
}

export async function getManagerMy() {
  const { data } = await apiClient.get("/api/orders/manager/my", {
    withCredentials: true,
  });
  return data;
}

export async function takeOrder(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/${orderId}/manager/take`
  );
  return data;
}

export async function markReady(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/${orderId}/manager/mark-ready`
  );
  return data;
}

export async function getManagerOrderDetails(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.get(`/api/orders/manager/${orderId}`, {
    withCredentials: true,
  });
  return data;
}

export async function getManagerOrderHistory(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.get(
    `/api/orders/manager/${orderId}/history`,
    { withCredentials: true }
  );
  return data;
}

export async function cancelManagerOrder(orderId, reason) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/${orderId}/manager/cancel`,
    { reason }
  );
  return data;
}

export async function getAdminOrdersList(filters = {}) {
  const params = {};

  if (filters.statusId !== undefined && filters.statusId !== null && filters.statusId !== "") {
    params.statusId = filters.statusId;
  }
  if (filters.clientId !== undefined && filters.clientId !== null && filters.clientId !== "") {
    params.clientId = filters.clientId;
  }
  if (filters.managerId !== undefined && filters.managerId !== null && filters.managerId !== "") {
    params.managerId = filters.managerId;
  }
  if (filters.courierId !== undefined && filters.courierId !== null && filters.courierId !== "") {
    params.courierId = filters.courierId;
  }
  if (filters.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }
  if (filters.dateTo) {
    params.dateTo = filters.dateTo;
  }
  if (filters.limit !== undefined && filters.limit !== null) {
    params.limit = filters.limit;
  }
  if (filters.offset !== undefined && filters.offset !== null) {
    params.offset = filters.offset;
  }
  if (filters.sortBy) {
    params.sortBy = filters.sortBy;
  }
  if (filters.sortDir) {
    params.sortDir = filters.sortDir;
  }
  if (filters.q) {
    params.q = filters.q;
  }

  const { data } = await apiClient.get("/api/orders/admin", {
    params,
    withCredentials: true,
  });
  return data;
}

export async function getAdminOrderStatuses() {
  const { data } = await apiClient.get("/api/orders/admin/statuses", {
    withCredentials: true,
  });
  return data;
}

export async function getAdminManagers() {
  const { data } = await apiClient.get("/api/orders/admin/users/manager", {
    withCredentials: true,
  });
  return data;
}

export async function getAdminCouriers() {
  const { data } = await apiClient.get("/api/orders/admin/users/courier", {
    withCredentials: true,
  });
  return data;
}

export async function getAdminOrderCounters(filters = {}) {
  const params = {};
  if (filters.statusId !== undefined && filters.statusId !== null && filters.statusId !== "") {
    params.statusId = filters.statusId;
  }
  if (filters.managerId !== undefined && filters.managerId !== null && filters.managerId !== "") {
    params.managerId = filters.managerId;
  }
  if (filters.courierId !== undefined && filters.courierId !== null && filters.courierId !== "") {
    params.courierId = filters.courierId;
  }
  if (filters.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }
  if (filters.dateTo) {
    params.dateTo = filters.dateTo;
  }
  if (filters.q) {
    params.q = filters.q;
  }

  const { data } = await apiClient.get("/api/orders/admin/counters", {
    params,
    withCredentials: true,
  });
  return data;
}

export async function getAdminOrderDetails(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.get(`/api/orders/admin/${orderId}`, {
    withCredentials: true,
  });
  return data;
}

export async function getAdminOrderHistory(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.get(`/api/orders/admin/${orderId}/history`, {
    withCredentials: true,
  });
  return data;
}

export async function adminOrderChangeStatus(orderId, payload) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/admin/${orderId}/status`,
    payload
  );
  return data;
}

export async function adminOrderAssign(orderId, payload) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/admin/${orderId}/assign`,
    payload
  );
  return data;
}

export async function adminOrderUnassign(orderId, payload) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/admin/${orderId}/unassign`,
    payload
  );
  return data;
}

export async function adminOrderCancel(orderId, payload) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/admin/${orderId}/cancel`,
    payload
  );
  return data;
}

export async function adminOrderUpdateDelivery(orderId, payload) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.patch(
    `/api/orders/admin/${orderId}/delivery`,
    payload
  );
  return data;
}

export async function adminOrderUpdateInternalComment(orderId, payload) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.patch(
    `/api/orders/admin/${orderId}/comment-internal`,
    payload
  );
  return data;
}
