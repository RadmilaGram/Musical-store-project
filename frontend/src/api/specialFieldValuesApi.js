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

export const specialFieldValuesApi = {
  async list(fieldId) {
    const response = await apiClient.get(`/api/special-fields/${fieldId}/values`);
    return unwrap(response);
  },
  async create(fieldId, payload) {
    const response = await apiClient.post(`/api/special-fields/${fieldId}/values`, payload);
    return unwrap(response);
  },
  async update(fieldId, payload) {
    const response = await apiClient.put(`/api/special-fields/${fieldId}/values`, payload);
    return unwrap(response);
  },
  async remove(fieldId, payload) {
    const response = await apiClient.delete(`/api/special-fields/${fieldId}/values`, {
      data: payload,
    });
    return unwrap(response);
  },
};

export default specialFieldValuesApi;
