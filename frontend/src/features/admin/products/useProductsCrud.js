import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import productsApi from "../../../api/productsApi";
import {
  setError,
  setItems,
  setLastLoadedAt,
  setLoading,
} from "./productsSlice";
import {
  selectProductsError,
  selectProductsItems,
  selectProductsLastLoadedAt,
  selectProductsStatus,
} from "./productsSelectors";

const DEFAULT_TTL = 300000;

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export function useProductsCrud() {
  const dispatch = useDispatch();
  const items = useSelector(selectProductsItems);
  const status = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);
  const lastLoadedAt = useSelector(selectProductsLastLoadedAt);

  const loadList = useCallback(async () => {
    dispatch(setLoading());
    try {
      const data = await productsApi.list();
      dispatch(setItems(data));
      dispatch(setLastLoadedAt(Date.now()));
    } catch (err) {
      dispatch(setError(getErrorMessage(err, "Failed to load products")));
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

  const createProduct = useCallback(
    async (payload) => {
      try {
        await productsApi.create(payload);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to create product")));
        throw err;
      }
    },
    [reload, dispatch]
  );

  const updateProduct = useCallback(
    async (id, payload) => {
      try {
        await productsApi.update(id, payload);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to update product")));
        throw err;
      }
    },
    [reload, dispatch]
  );

  const deleteProduct = useCallback(
    async (id) => {
      try {
        await productsApi.remove(id);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to delete product")));
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
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
