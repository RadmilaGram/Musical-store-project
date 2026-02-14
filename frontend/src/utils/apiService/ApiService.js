import axios from "axios";
import { API_BASE_URL, apiClient } from "../../api/axiosInstance";

export const API_URL = API_BASE_URL;

// Reading part ---------------------------------------------------------------------------------------

// read all Brands
export const getBrand = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/brands`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Ошибка при получении бренда:", error);
    throw error;
  }
};

// read all product type
export const getProdType = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/product-types`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Ошибка при получении типа продукта:", error);
    throw error;
  }
};

// read all product statuses
export const getProdSatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/product-statuses`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Ошибка при получении статуса продукта:", error);
    throw error;
  }
};

// Adding part ---------------------------------------------------------------------------------------

// add Brand

export async function placeOrder(payload) {
  // Temporary stub: replace endpoint when backend is implemented
  return axios.post(`${API_URL}/api/orders`, payload);
}

export const loginByEmail = async ({ email, password }) => {
  const { data } = await axios.post(
    `${API_URL}/api/login`,
    {
      email,
      password,
    },
    { withCredentials: true }
  );
  return data; // { user, token }
};

export const logoutUser = async () => {
  const { data } = await axios.post(
    `${API_URL}/api/auth/logout`,
    {},
    { withCredentials: true }
  );
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get("/api/auth/me");
  return data;
};

export const registerUser = async ({
  full_name,
  email,
  phone,
  address,
  password,
}) => {
  const { data } = await apiClient.post("/api/auth/register", {
    full_name,
    email,
    phone,
    address,
    password,
  });
  return data;
};

export const changePassword = async ({ current_password, new_password }) => {
  const { data } = await apiClient.post("/api/auth/change-password", {
    current_password,
    new_password,
  });
  return data;
};
