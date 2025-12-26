import { useEffect, useState } from "react";
import productsApi from "../api/productsApi";

const normalizeProduct = (product) => {
  const specialRaw =
    product.specialFieldsRaw ||
    product.special_fields ||
    product.specialFields ||
    product.special_filds;

  let specialParsed = {};
  if (typeof specialRaw === "string" && specialRaw.trim()) {
    try {
      specialParsed = JSON.parse(specialRaw);
    } catch (err) {
      console.warn("Failed to parse special fields", product.id, err);
      specialParsed = {};
    }
  } else if (specialRaw && typeof specialRaw === "object") {
    specialParsed = specialRaw;
  }

  return {
    ...product,
    type_name: product.type_name || product.typeName || "",
    brand_name: product.brand_name || product.brandName || "",
    special_fields: specialParsed,
  };
};

export const useProducts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    productsApi
      .list()
      .then((items) => {
        const normalized = (items || []).map(normalizeProduct);
        setData(normalized);
      })
      .catch((err) => {
        console.error("Ошибка при загрузке товаров:", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};
