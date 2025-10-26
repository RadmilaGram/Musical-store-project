import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
  isLoggedIn: false, // <-- добавили флаг
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authStart(state) {
      state.status = "loading";
      state.error = null;
    },
    authSuccess(state, action) {
      state.status = "succeeded";
      state.user = action.payload.user || null;
      state.token = action.payload.token || null;
      state.isLoggedIn = Boolean(state.token || state.user); // <-- важная строка
    },
    authFailure(state, action) {
      state.status = "failed";
      state.error = action.payload || "Login failed";
      state.isLoggedIn = false; // <-- на всякий случай
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      state.isLoggedIn = false; // <-- обнуляем
    },
  },
});

export const { authStart, authSuccess, authFailure, logout } =
  authSlice.actions;
export default authSlice.reducer;
