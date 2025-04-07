import axios from "axios";

const API_URL = "http://localhost:5000";

// read all Brands
export const fetchBrand = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/brand`);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении бренда:", error);
    throw error;
  }
};

// add Brand
export const addBrand = async (brandName) => {
  try {
    const response = await axios.post(`${API_URL}/api/addBrand`, brandName );
    return response.data;
  } catch (error) {
    console.error("Ошибка при добавлении бренда:", error);
    throw error;
  }
};
