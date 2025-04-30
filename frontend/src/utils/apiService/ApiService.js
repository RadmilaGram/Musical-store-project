import axios from "axios";

export const API_URL = "http://localhost:5000";

// Reading part ---------------------------------------------------------------------------------------

// read all Brands
export const getBrand = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/brand`);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении бренда:", error);
    throw error;
  }
};

// read all product type
export const getProdType = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/prodType`);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении типа продукта:", error);
    throw error;
  }
};

// read all product type
export const getProdSatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/prodStatus`);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении статуса продукта:", error);
    throw error;
  }
};

// read all special fields types
export const getSpecialFieldDT = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/SpecialFieldDT`);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении типа данных специальных полей:", error);
    throw error;
  }
};

// read all special fields
export const getSpecialField = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/SpecialField`);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении специальных полей:", error);
    throw error;
  }
};

// read all special fields
export const getSpecialFieldWithDefaultValues = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/SpecialFieldWithDefaultValues`
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении специальных полей:", error);
    throw error;
  }
};

// read all special fields
export const getSpecialFieldValues = async (fieldID) => {
  try {
    const response = await axios.get(`${API_URL}/api/SpecialFieldValues`, {
      params: { fieldID },
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении специальных полей:", error);
    throw error;
  }
};

// read all special fields
export const getTypeSpecialFields = async (typeID) => {
  try {
    const response = await axios.get(`${API_URL}/api/TypeSpecialFields`, {
      params: { typeID },
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении специальных полей:", error);
    throw error;
  }
};

// Adding part ---------------------------------------------------------------------------------------

// add Brand
export const addBrand = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/api/addBrand`, formData);
    return response.data;
  } catch (error) {
    console.error("Ошибка при добавлении бренда:", error);
    throw error;
  }
};

// add product type
export const addProdType = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/api/addProdType`, formData);
    return response.data;
  } catch (error) {
    console.error("Ошибка при добавлении типа продукта:", error);
    throw error;
  }
};

// add product
export const addProduct = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/api/addProduct`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка при добавлении типа продукта:", error);
    throw error;
  }
};

export const addSpecialField = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/addSpecialField`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при добавлении специального поля:", error);
    throw error;
  }
};

export const addSpecialFieldValue = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/addSpecialFieldValue`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при добавлении специального поля:", error);
    throw error;
  }
};

export const addSpecialFieldToProductType = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/addSpecialFieldToProductType`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при добавлении специального поля:", error);
    throw error;
  }
};

export const addTradeInProduct = async ({ product_id, discount }) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/tradein`,
      { product_id, discount }
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при добавлении специального поля:", error);
    throw error;
  }
};

export async function placeOrder(payload) {
  // Temporary stub: replace endpoint when backend is implemented
  return axios.post(`${API_URL}/api/orders`, payload);
}

