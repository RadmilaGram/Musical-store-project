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

export const brandsApi = {
  async list() {
    const response = await apiClient.get("/api/brands");
    return unwrap(response);
  },
  async create(payload) {
    const response = await apiClient.post("/api/brands", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await apiClient.put(`/api/brands/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await apiClient.delete(`/api/brands/${id}`);
    return unwrap(response);
  },
};

export default brandsApi;
