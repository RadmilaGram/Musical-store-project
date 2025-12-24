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

export const specialFieldsApi = {
  async list() {
    const response = await apiClient.get("/api/special-fields");
    return unwrap(response);
  },
  async getOne(id) {
    const response = await apiClient.get(`/api/special-fields/${id}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await apiClient.post("/api/special-fields", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await apiClient.put(`/api/special-fields/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await apiClient.delete(`/api/special-fields/${id}`);
    return unwrap(response);
  },
};

export default specialFieldsApi;
