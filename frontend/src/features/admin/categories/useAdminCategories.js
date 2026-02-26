import { useCallback, useEffect, useState } from "react";
import adminCategoriesApi from "../../../api/adminCategoriesApi";

export function useAdminCategories() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await adminCategoriesApi.list();
      setData(Array.isArray(items) ? items : []);
    } catch (err) {
      setData([]);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  return { data, loading, error, reload };
}

export default useAdminCategories;
