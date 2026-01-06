import { useEffect, useState } from "react";
import specialFieldsApi from "../api/specialFieldsApi";

export function useSpecialFieldsCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    specialFieldsApi
      .list()
      .then((data) => {
        if (!isMounted) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setItems([]);
        setError(err);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { items, loading, error };
}

export default useSpecialFieldsCatalog;
