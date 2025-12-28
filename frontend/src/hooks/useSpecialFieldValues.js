import { useEffect, useState } from "react";
import { getSpecialFieldValues } from "../utils/apiService/ApiService";

export const useSpecialFieldValues = () => {
  const [specialFieldValues, setSpecialField] = useState([]);

  const fetchSpecialFieldValues = (fieldID) => {
    getSpecialFieldValues(fieldID)
      .then(setSpecialField)
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      });
  };

  return { specialFieldValues, fetchSpecialFieldValues };
};
