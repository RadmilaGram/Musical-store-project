// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import tradeInReducer from './tradeInSlice';

export const store = configureStore({
  reducer: {
    tradeIn: tradeInReducer,
  },
});
