import { useState } from "react";
import { getTypeSpecialFields } from "../utils/apiService/ApiService";

export const useProductTypeSpecialFields = () => {
  const [productTypeSpecialFields, setSpecialField] = useState([]);

  const fetchProductTypeSpecialFields = (typeID) => {
    getTypeSpecialFields(typeID)
      .then(setSpecialField)
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      });
  };

  return { productTypeSpecialFields, fetchProductTypeSpecialFields };
};
