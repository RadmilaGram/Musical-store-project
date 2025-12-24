import { useCallback, useEffect, useState } from "react";
import specialFieldValuesApi from "../../../api/specialFieldValuesApi";

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export function useSpecialFieldValues(fieldId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!fieldId) {
      setItems([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await specialFieldValuesApi.list(fieldId);
      setItems(data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load values"));
    } finally {
      setLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    load();
  }, [load]);

  const createValue = useCallback(
    async (value) => {
      if (!fieldId) return;
      await specialFieldValuesApi.create(fieldId, { value });
      await load();
    },
    [fieldId, load]
  );

  const updateValue = useCallback(
    async (oldValue, newValue) => {
      if (!fieldId) return;
      await specialFieldValuesApi.update(fieldId, { oldValue, newValue });
      await load();
    },
    [fieldId, load]
  );

  const deleteValue = useCallback(
    async (value) => {
      if (!fieldId) return;
      await specialFieldValuesApi.remove(fieldId, { value });
      await load();
    },
    [fieldId, load]
  );

  return {
    fieldId,
    items,
    loading,
    error,
    reload: load,
    createValue,
    updateValue,
    deleteValue,
  };
}

export default useSpecialFieldValues;
