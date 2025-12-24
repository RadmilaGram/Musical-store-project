// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import tradeInReducer from "./tradeInSlice";
import ui from "./uiSlice";
import cartReducer from "./cartSlice";
import adminBrandsReducer from "../features/admin/brands/brandsSlice";
import adminProductTypesReducer from "../features/admin/productTypes/productTypesSlice";
import { loadState, saveState } from "./persist";

const preloadedState = loadState();

const store = configureStore({
  reducer: {
    auth: authReducer,
    tradeIn: tradeInReducer,
    cart: cartReducer,
    ui: ui,
    adminBrands: adminBrandsReducer,
    adminProductTypes: adminProductTypesReducer,
  },
  preloadedState, // если undefined — RTK подхватит initialState из каждого слайса
});

// Подписка: при любом изменении сохраняем три слайса
store.subscribe(() => {
  saveState(store.getState());
});

export default store;
