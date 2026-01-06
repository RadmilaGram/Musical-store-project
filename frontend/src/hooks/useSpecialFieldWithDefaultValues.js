import { useEffect, useState } from "react";
import { getSpecialFieldWithDefaultValues } from "../utils/apiService/ApiService";

export const useSpecialFieldWithDefaultValues = () => {
  const [specialField, setSpecialField] = useState([]);

  const fetchSpecialField = () => {
    getSpecialFieldWithDefaultValues()
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
