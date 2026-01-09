// src/hooks/useTradeInConfigs.js
import { useCallback, useEffect, useState } from "react";
import tradeInStoreApi from "../api/tradeInStoreApi";
import { computeTradeInOffer } from "../use-cases/trade-in/computeTradeInOffer";

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
      const offer = computeTradeInOffer(entry, condition);
      return offer?.discount ?? 0;
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
