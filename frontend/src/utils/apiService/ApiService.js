
import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Получить всех производителей
export const fetchBrand = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/brand`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении бренда:', error);
        throw error;
    }
};
