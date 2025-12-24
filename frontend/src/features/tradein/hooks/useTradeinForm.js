import { useCallback, useEffect, useState } from "react";
import {
  fetchBrands,
  fetchProductTypes,
  fetchProductsCatalog,
} from "../../../api/productsApi";
import { createTradeinConfig } from "../../../api/tradeinApi";

const INITIAL_STATE = {
  data: [],
  loading: false,
  error: null,
};

export function useTradeinForm() {
  const [typesState, setTypesState] = useState(INITIAL_STATE);
  const [brandsState, setBrandsState] = useState(INITIAL_STATE);
  const [productsState, setProductsState] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setTypesState((prev) => ({ ...prev, loading: true }));
      setBrandsState((prev) => ({ ...prev, loading: true }));
      setProductsState((prev) => ({ ...prev, loading: true }));
      try {
        const [types, brands, products] = await Promise.all([
          fetchProductTypes(),
          fetchBrands(),
          fetchProductsCatalog(),
        ]);

        if (!isMounted) {
          return;
        }

        setTypesState({ data: types ?? [], loading: false, error: null });
        setBrandsState({ data: brands ?? [], loading: false, error: null });
        setProductsState({ data: products ?? [], loading: false, error: null });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setTypesState((prev) => ({ ...prev, loading: false, error }));
        setBrandsState((prev) => ({ ...prev, loading: false, error }));
        setProductsState((prev) => ({ ...prev, loading: false, error }));
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const addTradeinProduct = useCallback(
    async ({ productId, referencePrice, baseDiscountAmount }) => {
      setIsSubmitting(true);
      try {
        const normalizedProductId = Number(productId);
        const normalizedBase = Number(baseDiscountAmount);
        await createTradeinConfig({
          productId: Number.isNaN(normalizedProductId)
            ? productId
            : normalizedProductId,
          referencePrice:
            typeof referencePrice === "number" ? referencePrice : null,
          baseDiscountAmount: Number.isNaN(normalizedBase)
            ? null
            : normalizedBase,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    types: typesState.data,
    brands: brandsState.data,
    products: productsState.data,
    loading: typesState.loading || brandsState.loading || productsState.loading,
    error: typesState.error || brandsState.error || productsState.error,
    isSubmitting,
    addTradeinProduct,
  };
}
