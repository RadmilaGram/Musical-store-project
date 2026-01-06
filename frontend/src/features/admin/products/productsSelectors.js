const selectProductsState = (state) => state.adminProducts || {};

export const selectProductsItems = (state) =>
  selectProductsState(state).items || [];

export const selectProductsStatus = (state) =>
  selectProductsState(state).status || "idle";

export const selectProductsError = (state) =>
  selectProductsState(state).error || null;

export const selectProductsLastLoadedAt = (state) =>
  selectProductsState(state).lastLoadedAt || 0;
