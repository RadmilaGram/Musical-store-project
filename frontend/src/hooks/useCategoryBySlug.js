import { useCallback, useEffect, useState } from "react";
import categoriesApi from "../api/categoriesApi";

const SLUG_REGEX = /^[a-z0-9-]+$/;

const makeNotFoundError = () => ({
  status: 404,
  message: "Category not found",
});

export function useCategoryBySlug(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    const normalizedSlug = typeof slug === "string" ? slug.trim() : "";

    if (!normalizedSlug || !SLUG_REGEX.test(normalizedSlug)) {
      setData(null);
      setLoading(false);
      setError(makeNotFoundError());
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const details = await categoriesApi.getBySlug(normalizedSlug);
      setData(details || null);
      return details || null;
    } catch (err) {
      setData(null);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  return { data, loading, error, reload };
}

export default useCategoryBySlug;
