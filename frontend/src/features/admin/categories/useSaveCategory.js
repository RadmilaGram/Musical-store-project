import { useCallback, useState } from "react";
import adminCategoriesApi from "../../../api/adminCategoriesApi";

export function useSaveCategory() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const saveCategory = useCallback(async (payload = {}) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (payload.id) {
        return await adminCategoriesApi.update(payload.id, payload);
      }
      return await adminCategoriesApi.create(payload);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { saveCategory, isSubmitting, error, setError };
}

export default useSaveCategory;
