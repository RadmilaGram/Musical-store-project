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

export const adminCategoriesApi = {
  async list() {
    const response = await apiClient.get("/api/admin/categories");
    return unwrap(response);
  },
  async create(payload) {
    const response = await apiClient.post("/api/admin/categories", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await apiClient.put(`/api/admin/categories/${id}`, payload);
    return unwrap(response);
  },
  async toggleActive(id, isActive) {
    const response = await apiClient.patch(
      `/api/admin/categories/${id}/active`,
      { is_active: isActive ? 1 : 0 }
    );
    return unwrap(response);
  },
};

export default adminCategoriesApi;
