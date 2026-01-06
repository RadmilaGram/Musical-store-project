const selectProductTypesState = (state) => state.adminProductTypes || {};

export const selectProductTypesItems = (state) =>
  selectProductTypesState(state).items || [];

export const selectProductTypesStatus = (state) =>
  selectProductTypesState(state).status || "idle";

export const selectProductTypesError = (state) =>
  selectProductTypesState(state).error || null;

export const selectProductTypesLastLoadedAt = (state) =>
  selectProductTypesState(state).lastLoadedAt || 0;
