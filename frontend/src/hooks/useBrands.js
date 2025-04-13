import { useEffect, useState } from "react";
import { getBrand } from "../utils/apiService/ApiService";

export const useBrands = () => {
  const [brands, setBrands] = useState([]);

  const fetchBrands = () => {
    getBrand().then(setBrands).catch(console.error);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return { brands, fetchBrands };
};
