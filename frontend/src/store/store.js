import { configureStore } from "@reduxjs/toolkit";
import userReducer       from "./userSlice";
import tradeInReducer from "./tradeInSlice";
import cartReducer      from "./cartSlice";

export const store = configureStore({
  reducer: {
    user:    userReducer,
    tradeIn: tradeInReducer,
    cart:     cartReducer,
  },
});