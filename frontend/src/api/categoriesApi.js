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

export const categoriesApi = {
  async list() {
    const response = await apiClient.get("/api/categories");
    return unwrap(response);
  },
  async getBySlug(slug) {
    const response = await apiClient.get(`/api/categories/${slug}`);
    return unwrap(response);
  },
};

export default categoriesApi;
