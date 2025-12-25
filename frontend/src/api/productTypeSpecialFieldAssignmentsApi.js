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

export const productTypeSpecialFieldAssignmentsApi = {
  async getAssignments(typeId) {
    const response = await apiClient.get(
      `/api/product-types/${typeId}/special-field-assignments`
    );
    return unwrap(response);
  },
  async setAssignments(typeId, fieldIds) {
    const response = await apiClient.put(
      `/api/product-types/${typeId}/special-field-assignments`,
      {
        fieldIds,
      }
    );
    return unwrap(response);
  },
};

export default productTypeSpecialFieldAssignmentsApi;
