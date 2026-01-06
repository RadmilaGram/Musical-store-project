const selectSpecialFieldsState = (state) =>
  state.adminSpecialFields || {};

export const selectSpecialFieldsItems = (state) =>
  selectSpecialFieldsState(state).items || [];

export const selectSpecialFieldsStatus = (state) =>
  selectSpecialFieldsState(state).status || "idle";

export const selectSpecialFieldsError = (state) =>
  selectSpecialFieldsState(state).error || null;

export const selectSpecialFieldsLastLoadedAt = (state) =>
  selectSpecialFieldsState(state).lastLoadedAt || 0;
