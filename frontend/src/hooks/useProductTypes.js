import { useEffect, useState } from "react";
import { getProdType } from "../utils/apiService/ApiService";

export const useProductTypes = () => {
  const [types, setTypes] = useState([]);

  useEffect(() => {
    getProdType().then(setTypes).catch(console.error);
  }, []);

  return types;
};
