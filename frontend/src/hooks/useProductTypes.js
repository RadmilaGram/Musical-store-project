import { useEffect, useState } from "react";
import { getProdType } from "../utils/apiService/ApiService";

export const useProductTypes = () => {
  const [types, setTypes] = useState([]);

  const fetchProdType = () => {
    getProdType().then(setTypes).catch(console.error);
  };

  useEffect(() => {
    fetchProdType();
  }, []);

  return { types, fetchProdType };
};
