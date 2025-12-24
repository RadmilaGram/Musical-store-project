import { apiClient } from "./axiosInstance";

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
