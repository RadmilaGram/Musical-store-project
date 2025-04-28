// src/hooks/useTradeInConfigs.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/apiService/ApiService';

export function useTradeInConfigs() {
  const [tradeInConfigs, setTradeInConfigs] = useState([]);

  const fetchTradeInConfigs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tradein`);
      setTradeInConfigs(response.data);
    } catch (error) {
      console.error('Error fetching trade-in configs:', error);
    }
  };

  useEffect(() => {
    fetchTradeInConfigs();
  }, []);

  return { tradeInConfigs, fetchTradeInConfigs };
}
