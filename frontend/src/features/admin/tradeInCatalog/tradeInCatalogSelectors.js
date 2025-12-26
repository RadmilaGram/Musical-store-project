export const selectTradeInCatalogState = (state) => state.adminTradeInCatalog;

export const selectTradeInCatalogItems = (state) =>
  selectTradeInCatalogState(state)?.items || [];

export const selectTradeInCatalogStatus = (state) =>
  selectTradeInCatalogState(state)?.status || "idle";

export const selectTradeInCatalogError = (state) =>
  selectTradeInCatalogState(state)?.error || null;

export const selectTradeInCatalogLastLoadedAt = (state) =>
  selectTradeInCatalogState(state)?.lastLoadedAt || 0;
