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

export const productTypeSpecialFieldsApi = {
  async listByType(typeId) {
    const response = await apiClient.get(
      `/api/product-types/${typeId}/special-fields`
    );
    return unwrap(response);
  },
};

export default productTypeSpecialFieldsApi;
