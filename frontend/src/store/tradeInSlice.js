// src/store/tradeInSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // здесь будем хранить { id, name, brand_name, type_name, expectedDiscount, ... }
};

const tradeInSlice = createSlice({
  name: 'tradeIn',
  initialState,
  reducers: {
    resetTradeIn: () => initialState,
    addItem: (state, action) => {
      const payload = action.payload || {};
      const productKeyRaw =
        payload.id ??
        payload.productId ??
        payload.prod?.id ??
        payload.prod?.productId;
      const productKey = productKeyRaw ? String(productKeyRaw) : "";
      const conditionCode = payload.conditionCode;
      const tradeInKey =
        payload.tradeInKey ||
        (productKey && conditionCode
          ? `${productKey}__${conditionCode}`
          : undefined);
      const existing = tradeInKey
        ? state.items.find((item) => item.tradeInKey === tradeInKey)
        : undefined;
      if (existing) {
        const delta = payload.quantity ?? 1;
        existing.quantity = (existing.quantity ?? 1) + delta;
        return;
      }
      state.items.push({
        ...payload,
        tradeInKey,
        quantity: payload.quantity ?? 1,
      });
    },
    removeItem: (state, action) => {
      const key = action.payload?.tradeInKey ?? action.payload;
      if (!key) {
        const fallbackId = action.payload?.id ?? action.payload;
        state.items = state.items.filter((i) => i.id !== fallbackId);
        return;
      }
      state.items = state.items.filter((i) => i.tradeInKey !== key);
    },
    incrementQty: (state, action) => {
      const key = action.payload?.tradeInKey ?? action.payload;
      if (!key) return;
      const item = state.items.find((i) => i.tradeInKey === key);
      if (!item) return;
      item.quantity = (item.quantity ?? 1) + 1;
    },
    decrementQty: (state, action) => {
      const key = action.payload?.tradeInKey ?? action.payload;
      if (!key) return;
      const item = state.items.find((i) => i.tradeInKey === key);
      if (!item) return;
      const nextQty = (item.quantity ?? 1) - 1;
      if (nextQty <= 0) {
        state.items = state.items.filter((i) => i.tradeInKey !== key);
      } else {
        item.quantity = nextQty;
      }
    },
    clearAll: (state) => {
      state.items = [];
    },
  },
});

export const {
  resetTradeIn,
  addItem,
  removeItem,
  incrementQty,
  decrementQty,
  clearAll,
} = tradeInSlice.actions;
export default tradeInSlice.reducer;
