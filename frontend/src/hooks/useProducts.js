import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../utils/apiService/ApiService";

export const useProducts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/product-view`) 
      .then((res) => {
        console.log("Ответ от сервера:", res.data);
        const products = Array.isArray(res.data) ? res.data : res.data.products || [];
        const parsed = products.map((p) => ({
          ...p,
          special_fields: p.special_fields ? JSON.parse(p.special_fields) : {},
        }));
        
        console.log("Parsed:", res.data);
        setData(parsed);
      })
      .catch((err) => {
        console.error("Ошибка при загрузке товаров:", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};
