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
