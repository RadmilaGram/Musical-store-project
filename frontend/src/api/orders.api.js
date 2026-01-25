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
