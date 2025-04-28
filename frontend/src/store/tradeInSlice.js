// src/store/tradeInSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // здесь будем хранить { id, name, brand_name, type_name, expectedDiscount, ... }
};

const tradeInSlice = createSlice({
  name: 'tradeIn',
  initialState,
  reducers: {
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    removeItem: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    clearAll: (state) => {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, clearAll } = tradeInSlice.actions;
export default tradeInSlice.reducer;
