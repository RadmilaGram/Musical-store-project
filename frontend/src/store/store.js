import { configureStore } from "@reduxjs/toolkit";
import tradeInReducer from "./tradeInSlice";
import cartReducer      from "./cartSlice";

export const store = configureStore({
  reducer: {
    tradeIn: tradeInReducer,
    cart:     cartReducer,
  },
});