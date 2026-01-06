import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import tradeInConditionsApi from "../../../api/tradeInConditionsApi";
import {
  setError,
  setItems,
  setLastLoadedAt,
  setLoading,
} from "./tradeInConditionsSlice";
import {
  selectTradeInConditionsError,
  selectTradeInConditionsItems,
  selectTradeInConditionsLastLoadedAt,
  selectTradeInConditionsStatus,
} from "./tradeInConditionsSelectors";

const DEFAULT_TTL = 300000;

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export function useTradeInConditionsCrud() {
  const dispatch = useDispatch();
  const items = useSelector(selectTradeInConditionsItems);
  const status = useSelector(selectTradeInConditionsStatus);
  const error = useSelector(selectTradeInConditionsError);
  const lastLoadedAt = useSelector(selectTradeInConditionsLastLoadedAt);

  const loadList = useCallback(async () => {
    dispatch(setLoading());
    try {
      const data = await tradeInConditionsApi.list();
      const normalized = (data || []).map((item) => ({
        ...item,
        percent:
          item.percent === null || typeof item.percent === "undefined"
            ? item.percent
            : Number(item.percent),
      }));
      dispatch(setItems(normalized));
      dispatch(setLastLoadedAt(Date.now()));
    } catch (err) {
      dispatch(
        setError(getErrorMessage(err, "Failed to load trade-in conditions"))
      );
      throw err;
    }
  }, [dispatch]);

  const ensureLoaded = useCallback(
    async ({ force = false, ttlMs = DEFAULT_TTL } = {}) => {
      const hasItems = Array.isArray(items) && items.length > 0;
      const lastLoadedTs = lastLoadedAt || 0;
      const shouldReload =
        force ||
        (!hasItems && !lastLoadedTs) ||
        Date.now() - lastLoadedTs > ttlMs;

      if (!shouldReload) {
        return;
      }

      await loadList();
    },
    [items, lastLoadedAt, loadList]
  );

  const reload = useCallback(
    () => ensureLoaded({ force: true }),
    [ensureLoaded]
  );

  const createCondition = useCallback(
    async (payload) => {
      try {
        await tradeInConditionsApi.create(payload);
        await reload();
      } catch (err) {
        dispatch(
          setError(getErrorMessage(err, "Failed to create trade-in condition"))
        );
        throw err;
      }
    },
    [reload, dispatch]
  );

  const updateCondition = useCallback(
    async (code, payload) => {
      try {
        await tradeInConditionsApi.update(code, payload);
        await reload();
      } catch (err) {
        dispatch(
          setError(getErrorMessage(err, "Failed to update trade-in condition"))
        );
        throw err;
      }
    },
    [reload, dispatch]
  );

  const deleteCondition = useCallback(
    async (code) => {
      try {
        await tradeInConditionsApi.remove(code);
        await reload();
      } catch (err) {
        dispatch(
          setError(getErrorMessage(err, "Failed to delete trade-in condition"))
        );
        throw err;
      }
    },
    [reload, dispatch]
  );

  return {
    items,
    status,
    error,
    ensureLoaded,
    reload,
    createCondition,
    updateCondition,
    deleteCondition,
  };
}

export default useTradeInConditionsCrud;
