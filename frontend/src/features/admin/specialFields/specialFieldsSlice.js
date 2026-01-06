import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  status: "idle",
  error: null,
  lastLoadedAt: 0,
};

const specialFieldsSlice = createSlice({
  name: "adminSpecialFields",
  initialState,
  reducers: {
    setLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setItems(state, action) {
      state.items = action.payload || [];
      state.status = "succeeded";
      state.error = null;
    },
    setError(state, action) {
      state.error = action.payload || "Unknown error";
      state.status = "failed";
    },
    setLastLoadedAt(state, action) {
      state.lastLoadedAt = action.payload || 0;
    },
  },
});

export const { setLoading, setItems, setError, setLastLoadedAt } =
  specialFieldsSlice.actions;

export default specialFieldsSlice.reducer;
