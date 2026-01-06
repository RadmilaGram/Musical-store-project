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

export const productTypesApi = {
  async list() {
    const response = await apiClient.get("/api/product-types");
    return unwrap(response);
  },
  async create(payload) {
    const response = await apiClient.post("/api/product-types", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await apiClient.put(`/api/product-types/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await apiClient.delete(`/api/product-types/${id}`);
    return unwrap(response);
  },
};

export default productTypesApi;
