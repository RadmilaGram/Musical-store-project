// src/hooks/useTradeInConfigs.js
import { useCallback, useEffect, useState } from "react";
import tradeInStoreApi from "../api/tradeInStoreApi";

export function useTradeInConfigs() {
  const [catalog, setCatalog] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTradeInConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalogData, conditionsData] = await Promise.all([
        tradeInStoreApi.fetchCatalog(),
        tradeInStoreApi.fetchConditions(),
      ]);
      setCatalog(Array.isArray(catalogData) ? catalogData : []);
      setConditions(Array.isArray(conditionsData) ? conditionsData : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTradeInConfigs();
  }, [fetchTradeInConfigs]);

  const computeOffer = useCallback(
    ({ productId, conditionCode }) => {
      const entry = catalog.find(
        (item) => String(item.productId) === String(productId)
      );
      const condition = conditions.find(
        (item) => item.code === conditionCode || String(item.code) === String(conditionCode)
      );
      if (!entry || !condition) return 0;
      const cap = Number(entry.baseDiscountAmount ?? entry.referencePrice ?? 0);
      const percent = Number(condition.percent ?? 0);
      if (!Number.isFinite(cap) || !Number.isFinite(percent)) return 0;
      return Math.max(0, Math.round(cap * (percent / 100)));
    },
    [catalog, conditions]
  );

  return {
    tradeInCatalog: catalog,
    tradeInConfigs: catalog,
    conditions,
    loading,
    error,
    fetchTradeInConfigs,
    computeOffer,
  };
}
