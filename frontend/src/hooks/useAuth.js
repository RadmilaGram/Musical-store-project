import { useState } from "react";
import axios from "axios";
import { API_URL } from "../utils/apiService/ApiService";

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/login`, credentials);
      setLoading(false);
      return { data: response.data, error: null };
    } catch (error) {
      setLoading(false);
      return { data: null, error: error.response?.data?.message || "Login failed" };
    }
  };

  return { login, loading };
}