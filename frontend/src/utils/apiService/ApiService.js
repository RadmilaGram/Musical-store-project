
import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Получить всех производителей
export const fetchProducers = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/producers`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении производителей:', error);
        throw error;
    }
};
