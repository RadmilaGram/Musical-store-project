import { configureStore } from "@reduxjs/toolkit";
import tradeInReducer from "./tradeInSlice";
import cartReducer from "./cartSlice";
import authReducer from "./authSlice";

// Попытка прочитать сохранённый auth из localStorage
const savedAuth = localStorage.getItem("auth");
const preloadedAuth = savedAuth ? JSON.parse(savedAuth) : undefined;

const store = configureStore({
  reducer: {
    auth: authReducer,
    tradeIn: tradeInReducer,
    cart: cartReducer,
  },
  preloadedState: {
    auth: preloadedAuth,
  },
});

store.subscribe(() => {
  const { auth } = store.getState();
  if (auth.isLoggedIn) {
    // сохраняем весь объект auth
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: auth.user,
        token: auth.token,
        isLoggedIn: true,
      })
    );
  } else {
    // при логауте или сбросе — удаляем
    localStorage.removeItem("auth");
  }
});

export default store;
