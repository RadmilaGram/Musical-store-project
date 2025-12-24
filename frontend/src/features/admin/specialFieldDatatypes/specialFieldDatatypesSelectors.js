const selectDatatypesState = (state) =>
  state.adminSpecialFieldDatatypes || {};

export const selectSpecialFieldDatatypeItems = (state) =>
  selectDatatypesState(state).items || [];

export const selectSpecialFieldDatatypeStatus = (state) =>
  selectDatatypesState(state).status || "idle";

export const selectSpecialFieldDatatypeError = (state) =>
  selectDatatypesState(state).error || null;

export const selectSpecialFieldDatatypeLastLoadedAt = (state) =>
  selectDatatypesState(state).lastLoadedAt || 0;
