import { apiClient } from "./axiosInstance";

const unwrap = (response) => {
  const payload = response?.data;
  if (payload?.success) {
    return payload.data;
  }
  const message = payload?.message || "Request failed";
  const error = new Error(message);
  error.response = response;
  throw error;
};

const tradeInCatalogApi = {
  async list() {
    const response = await apiClient.get("/api/trade-in-catalog");
    return unwrap(response);
  },
  async create(payload) {
    const response = await apiClient.post("/api/trade-in-catalog", payload);
    return unwrap(response);
  },
  async update(productId, payload) {
    const response = await apiClient.put(
      `/api/trade-in-catalog/${productId}`,
      payload
    );
    return unwrap(response);
  },
  async remove(productId) {
    const response = await apiClient.delete(
      `/api/trade-in-catalog/${productId}`
    );
    return unwrap(response);
  },
};

export default tradeInCatalogApi;
