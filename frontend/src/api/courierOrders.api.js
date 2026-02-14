import { apiClient } from "./axiosInstance";

export async function getCourierQueue(options = {}) {
  const params = {};
  if (options.sortBy) {
    params.sortBy = options.sortBy;
  }
  if (options.sortDir) {
    params.sortDir = options.sortDir;
  }
  if (options.limit !== undefined && options.limit !== null) {
    params.limit = options.limit;
  }
  if (options.offset !== undefined && options.offset !== null) {
    params.offset = options.offset;
  }
  const { data } = await apiClient.get("/api/orders/courier/queue", {
    params,
    withCredentials: true,
  });
  return data;
}

export async function getCourierMy(options = {}) {
  const params = {};
  if (options.sortBy) {
    params.sortBy = options.sortBy;
  }
  if (options.sortDir) {
    params.sortDir = options.sortDir;
  }
  if (options.hideClosed) {
    params.hideClosed = 1;
  }
  if (options.limit !== undefined && options.limit !== null) {
    params.limit = options.limit;
  }
  if (options.offset !== undefined && options.offset !== null) {
    params.offset = options.offset;
  }
  const { data } = await apiClient.get("/api/orders/courier/my", {
    params,
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

export async function finishCourierOrder(orderId, payload) {
  if (!orderId) {
    return null;
  }
  const { data } = await apiClient.post(
    `/api/orders/${orderId}/courier/finish`,
    payload
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
