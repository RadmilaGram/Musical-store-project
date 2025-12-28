import { useEffect, useState } from "react";
import { getSpecialFieldDT } from "../utils/apiService/ApiService";

export const useSpecialFieldDT = () => {
  const [specialFieldDT, setSpecialFieldDT] = useState([]);

  const fetchSpecialFieldDT = () => {
    getSpecialFieldDT()
      .then(setSpecialFieldDT)
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      });
  };

  useEffect(() => {
    fetchSpecialFieldDT();
  }, []);

  return { specialFieldDT, fetchSpecialFieldDT };
};
