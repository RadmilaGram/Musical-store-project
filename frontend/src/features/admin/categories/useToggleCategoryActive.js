import { useCallback, useState } from "react";
import adminCategoriesApi from "../../../api/adminCategoriesApi";

export function useToggleCategoryActive() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggleCategoryActive = useCallback(async (id, isActive) => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await adminCategoriesApi.toggleActive(id, isActive);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { toggleCategoryActive, isSubmitting, error, setError };
}

export default useToggleCategoryActive;
