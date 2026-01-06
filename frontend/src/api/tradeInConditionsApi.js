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

const tradeInConditionsApi = {
  async list() {
    const response = await apiClient.get("/api/trade-in-conditions");
    return unwrap(response);
  },
  async getOne(code) {
    const response = await apiClient.get(`/api/trade-in-conditions/${code}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await apiClient.post("/api/trade-in-conditions", payload);
    return unwrap(response);
  },
  async update(code, payload) {
    const response = await apiClient.put(
      `/api/trade-in-conditions/${code}`,
      payload
    );
    return unwrap(response);
  },
  async remove(code) {
    const response = await apiClient.delete(
      `/api/trade-in-conditions/${code}`
    );
    return unwrap(response);
  },
};

export default tradeInConditionsApi;
