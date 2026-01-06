const selectBrandsState = (state) => state.adminBrands || {};

export const selectBrandsItems = (state) => selectBrandsState(state).items || [];

export const selectBrandsStatus = (state) =>
  selectBrandsState(state).status || "idle";

export const selectBrandsError = (state) =>
  selectBrandsState(state).error || null;

export const selectBrandsLastLoadedAt = (state) =>
  selectBrandsState(state).lastLoadedAt || 0;
