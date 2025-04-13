import { useEffect, useState } from "react";
import { getSpecialFieldDT } from "../utils/apiService/ApiService";

export const useSpecialFieldDT = () => {
  const [specialFieldDT, setSpecialFieldDT] = useState([]);

  const fetchSpecialFieldDT = () => {
    getSpecialFieldDT().then(setSpecialFieldDT).catch(console.error);
  };

  useEffect(() => {
    fetchSpecialFieldDT();
  }, []);

  return { specialFieldDT, fetchSpecialFieldDT };
};
