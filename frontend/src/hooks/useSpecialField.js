import { useEffect, useState } from "react";
import { getSpecialField } from "../utils/apiService/ApiService";

export const useSpecialField = () => {
  const [specialField, setSpecialField] = useState([]);

  const fetchSpecialField = () => {
    getSpecialField()
      .then(setSpecialField)
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      });
  };

  useEffect(() => {
    fetchSpecialField();
  }, []);

  return { specialField, fetchSpecialField };
};
