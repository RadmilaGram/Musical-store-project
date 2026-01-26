import { apiClient } from "./axiosInstance";

export async function getCourierQueue() {
  const { data } = await apiClient.get("/api/orders/courier/queue", {
    withCredentials: true,
  });
  return data;
}

export async function getCourierMy() {
  const { data } = await apiClient.get("/api/orders/courier/my", {
    withCredentials: true,
  });
  return data;
}

export async function takeCourierOrder(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/${orderId}/courier/take`
  );
  return data;
}

export async function finishCourierOrder(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/${orderId}/courier/finish`
  );
  return data;
}

export async function getCourierDetails(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.get(`/api/orders/courier/${orderId}`, {
    withCredentials: true,
  });
  return data;
}

export async function getCourierHistory(orderId) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.get(
    `/api/orders/courier/${orderId}/history`,
    { withCredentials: true }
  );
  return data;
}
