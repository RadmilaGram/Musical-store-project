import { useEffect, useState } from "react";
import { getSpecialField } from "../utils/apiService/ApiService";

export const useSpecialField = () => {
  const [specialField, setSpecialField] = useState([]);

  const fetchSpecialField = () => {
    getSpecialField().then(setSpecialField).catch(console.error);
  };

  useEffect(() => {
    fetchSpecialField();
  }, []);

  return { specialField, fetchSpecialField };
};
