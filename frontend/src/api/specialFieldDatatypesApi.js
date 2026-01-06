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

export const specialFieldDatatypesApi = {
  async list() {
    const response = await apiClient.get("/api/special-field-datatypes");
    return unwrap(response);
  },
};

export default specialFieldDatatypesApi;
