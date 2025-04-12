import { useEffect, useState } from "react";
import { getProdSatus } from "../utils/apiService/ApiService";

export const useStatuses = () => {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    getProdSatus().then(setStatuses).catch(console.error);
  }, []);

  return statuses;
};
