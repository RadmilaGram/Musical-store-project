import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import tradeInCatalogApi from "../../../api/tradeInCatalogApi";
import {
  setError,
  setItems,
  setLastLoadedAt,
  setLoading,
} from "./tradeInCatalogSlice";
import {
  selectTradeInCatalogError,
  selectTradeInCatalogItems,
  selectTradeInCatalogLastLoadedAt,
  selectTradeInCatalogStatus,
} from "./tradeInCatalogSelectors";

const DEFAULT_TTL = 300000;

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

const normalizeItems = (items) =>
  (items || []).map((item) => ({
    ...item,
    referencePrice:
      item.referencePrice === null || typeof item.referencePrice === "undefined"
        ? null
        : Number(item.referencePrice),
    baseDiscountAmount:
      item.baseDiscountAmount === null ||
      typeof item.baseDiscountAmount === "undefined"
        ? null
        : Number(item.baseDiscountAmount),
  }));

export function useTradeInCatalogCrud() {
  const dispatch = useDispatch();
  const items = useSelector(selectTradeInCatalogItems);
  const status = useSelector(selectTradeInCatalogStatus);
  const error = useSelector(selectTradeInCatalogError);
  const lastLoadedAt = useSelector(selectTradeInCatalogLastLoadedAt);

  const loadList = useCallback(async () => {
    dispatch(setLoading());
    try {
      const data = await tradeInCatalogApi.list();
      dispatch(setItems(normalizeItems(data)));
      dispatch(setLastLoadedAt(Date.now()));
    } catch (err) {
      dispatch(
        setError(getErrorMessage(err, "Failed to load trade-in catalog"))
      );
      throw err;
    }
  }, [dispatch]);

  const ensureLoaded = useCallback(
    async ({ force = false, ttlMs = DEFAULT_TTL } = {}) => {
      const shouldReload =
        force ||
        !items?.length ||
        Date.now() - (lastLoadedAt || 0) > ttlMs;

      if (!shouldReload) {
        return;
      }

      await loadList();
    },
    [items, lastLoadedAt, loadList]
  );

  const reload = useCallback(() => ensureLoaded({ force: true }), [ensureLoaded]);

  const createEntry = useCallback(
    async (payload) => {
      try {
        await tradeInCatalogApi.create(payload);
        await reload();
      } catch (err) {
        dispatch(
          setError(getErrorMessage(err, "Failed to create catalog entry"))
        );
        throw err;
      }
    },
    [reload, dispatch]
  );

  const updateEntry = useCallback(
    async (productId, payload) => {
      try {
        await tradeInCatalogApi.update(productId, payload);
        await reload();
      } catch (err) {
        dispatch(
          setError(getErrorMessage(err, "Failed to update catalog entry"))
        );
        throw err;
      }
    },
    [reload, dispatch]
  );

  const deleteEntry = useCallback(
    async (productId) => {
      try {
        await tradeInCatalogApi.remove(productId);
        await reload();
      } catch (err) {
        dispatch(
          setError(getErrorMessage(err, "Failed to delete catalog entry"))
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
    createEntry,
    updateEntry,
    deleteEntry,
  };
}

export default useTradeInCatalogCrud;
