import { apiClient } from "./axiosInstance";

export async function fetchTradeinConfigs() {
  const { data } = await apiClient.get("/api/tradein");
  return data;
}

export async function createTradeinConfig({
  productId,
  referencePrice = null,
  baseDiscountAmount = null,
}) {
  const payload = {
    product_id: productId,
    reference_price: referencePrice,
    base_discount_amount: baseDiscountAmount,
  };

  if (typeof baseDiscountAmount === "number") {
    payload.discount = baseDiscountAmount;
  }

  const { data } = await apiClient.post("/api/tradein", payload);
  return data;
}
