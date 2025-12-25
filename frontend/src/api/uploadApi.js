import { apiClient } from "./axiosInstance";

const unwrap = (response) => {
  const payload = response?.data;
  if (payload?.success) {
    return payload.data;
  }
  const message = payload?.message || "Upload failed";
  const error = new Error(message);
  error.response = response;
  throw error;
};

const uploadApi = {
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("img", file);
    const response = await apiClient.post("/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
  },
};

export default uploadApi;
