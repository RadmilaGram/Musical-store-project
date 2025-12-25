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

const parseProducts = (data) => {
  const products = Array.isArray(data) ? data : data?.products || [];
  return products.map((product) => ({
    ...product,
    special_fields: product.special_fields
      ? JSON.parse(product.special_fields)
      : {},
  }));
};

export async function fetchBrands() {
  const { data } = await apiClient.get("/api/brand");
  return data;
}

export async function fetchProductTypes() {
  const { data } = await apiClient.get("/api/prodType");
  return data;
}

export async function fetchProductsCatalog() {
  const { data } = await apiClient.get("/api/product-view");
  return parseProducts(data);
}

const productsApi = {
  async list() {
    const response = await apiClient.get("/api/products");
    return unwrap(response);
  },
  async getOne(id) {
    const response = await apiClient.get(`/api/products/${id}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await apiClient.post("/api/products", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await apiClient.put(`/api/products/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await apiClient.delete(`/api/products/${id}`);
    return unwrap(response);
  },
};

export default productsApi;
