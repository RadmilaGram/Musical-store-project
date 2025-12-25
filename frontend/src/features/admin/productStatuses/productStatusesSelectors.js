const selectProductStatusesState = (state) => state.adminProductStatuses || {};

export const selectProductStatusesItems = (state) =>
  selectProductStatusesState(state).items || [];

export const selectProductStatusesStatus = (state) =>
  selectProductStatusesState(state).status || "idle";

export const selectProductStatusesError = (state) =>
  selectProductStatusesState(state).error || null;

export const selectProductStatusesLastLoadedAt = (state) =>
  selectProductStatusesState(state).lastLoadedAt || 0;
