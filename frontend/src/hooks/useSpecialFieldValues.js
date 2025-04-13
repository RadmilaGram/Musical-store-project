import { useEffect, useState } from "react";
import { getSpecialFieldValues } from "../utils/apiService/ApiService";

export const useSpecialFieldValues = () => {
  const [specialFieldValues, setSpecialField] = useState([]);

  const fetchSpecialFieldValues = (fieldID) => {
    getSpecialFieldValues(fieldID).then(setSpecialField).catch(console.error);
  };

  return { specialFieldValues, fetchSpecialFieldValues };
};
