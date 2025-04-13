import { useEffect, useState } from "react";
import { getTypeSpecialFields } from "../utils/apiService/ApiService";

export const useProductTypeSpecialFields = () => {
  const [productTypeSpecialFields, setSpecialField] = useState([]);

  const fetchProductTypeSpecialFields = (typeID) => {
    getTypeSpecialFields(typeID).then(setSpecialField).catch(console.error);
    console.log(productTypeSpecialFields);
  };

  return { productTypeSpecialFields, fetchProductTypeSpecialFields };
};
