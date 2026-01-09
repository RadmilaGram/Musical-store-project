import { useEffect, useState } from "react";
import productsApi from "../../api/productsApi";

const productCache = new Map();

export function useProductById(productId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      productId === "" ||
      productId === null ||
      typeof productId === "undefined" ||
      Number(productId) === 0
    ) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    const key = String(productId);
    const cached = productCache.get(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setIsLoading(true);
    setError(null);
    productsApi
      .getOne(productId)
      .then((result) => {
        if (!active) return;
        const payload = result?.data?.data ?? result?.data ?? result ?? null;
        productCache.set(key, payload);
        setData(payload);
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
        setData(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  return { data, isLoading, error };
}
