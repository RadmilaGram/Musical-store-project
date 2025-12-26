import { useEffect, useState } from "react";
import brandsApi from "../api/brandsApi";

export const useBrands = () => {
  const [brands, setBrands] = useState([]);

  const fetchBrands = () => {
    brandsApi
      .list()
      .then(setBrands)
      .catch((error) => console.error("Failed to load brands", error));
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return { brands, fetchBrands };
};
