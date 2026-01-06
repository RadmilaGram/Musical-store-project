import { useCallback, useState } from "react";
import { useProductsCrud } from "./useProductsCrud";

export function useSaveProduct() {
  const { createProduct, updateProduct } = useProductsCrud();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveProduct = useCallback(
    async (payload) => {
      setIsSubmitting(true);
      try {
        if (payload.id) {
          await updateProduct(payload.id, payload);
        } else {
          await createProduct(payload);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [createProduct, updateProduct]
  );

  return { saveProduct, isSubmitting };
}

export default useSaveProduct;
