const selectTradeInConditionsState = (state) =>
  state.adminTradeInConditions || {};

export const selectTradeInConditionsItems = (state) =>
  selectTradeInConditionsState(state).items || [];

export const selectTradeInConditionsStatus = (state) =>
  selectTradeInConditionsState(state).status || "idle";

export const selectTradeInConditionsError = (state) =>
  selectTradeInConditionsState(state).error || null;

export const selectTradeInConditionsLastLoadedAt = (state) =>
  selectTradeInConditionsState(state).lastLoadedAt || 0;
