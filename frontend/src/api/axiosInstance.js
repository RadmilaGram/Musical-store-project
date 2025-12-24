import axios from "axios";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export { API_BASE_URL };
