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

const productStatusesApi = {
  async list() {
    const response = await apiClient.get("/api/product-statuses");
    return unwrap(response);
  },
};

export default productStatusesApi;
