import { apiClient } from "./axiosInstance";

const unwrap = (response) => {
  const payload = response?.data;
  if (payload?.success) {
    return payload.data;
  }
  return payload;
};

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  return Array.isArray(data?.data) ? data.data : [];
};

const tradeInStoreApi = {
  async fetchCatalog(params = {}) {
    const response = await apiClient.get("/api/trade-in-catalog", {
      params,
    });
    return ensureArray(unwrap(response));
  },
  async fetchConditions() {
    const response = await apiClient.get("/api/trade-in-conditions");
    return ensureArray(unwrap(response));
  },
};

export default tradeInStoreApi;
