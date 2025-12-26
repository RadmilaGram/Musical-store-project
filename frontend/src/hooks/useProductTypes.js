import { useEffect, useState } from "react";
import productTypesApi from "../api/productTypesApi";

export const useProductTypes = () => {
  const [types, setTypes] = useState([]);

  const fetchProdType = () => {
    productTypesApi
      .list()
      .then(setTypes)
      .catch((error) => console.error("Failed to load product types", error));
  };

  useEffect(() => {
    fetchProdType();
  }, []);

  return { types, fetchProdType };
};
