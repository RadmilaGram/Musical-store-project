import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    isLoginOpen: false,
  },
  reducers: {
    openLogin: (state) => {
      state.isLoginOpen = true;
    },
    closeLogin: (state) => {
      state.isLoginOpen = false;
    },
  },
});

export const { openLogin, closeLogin } = uiSlice.actions;
export default uiSlice.reducer;
