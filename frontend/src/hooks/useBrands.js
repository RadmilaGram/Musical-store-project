import { useEffect, useState } from "react";
import { getBrand } from "../utils/apiService/ApiService";

export const useBrands = () => {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    getBrand().then(setBrands).catch(console.error);
  }, []);

  return brands;
};
