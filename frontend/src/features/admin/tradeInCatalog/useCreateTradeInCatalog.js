import { useCallback, useState } from "react";
import { useTradeInCatalogCrud } from "./useTradeInCatalogCrud";

export function useCreateTradeInCatalog() {
  const { createEntry } = useTradeInCatalogCrud();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCatalogEntry = useCallback(
    async (payload) => {
      setIsSubmitting(true);
      try {
        await createEntry(payload);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createEntry]
  );

  return { createCatalogEntry, isSubmitting };
}

export default useCreateTradeInCatalog;
