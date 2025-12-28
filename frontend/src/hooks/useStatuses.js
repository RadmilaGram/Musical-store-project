import { useEffect, useState } from "react";
import productStatusesApi from "../api/productStatusesApi";

export const useStatuses = () => {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    productStatusesApi
      .list()
      .then(setStatuses)
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Failed to load product statuses", error);
        }
      });
  }, []);

  return statuses;
};
