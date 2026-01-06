import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import productTypesApi from "../../../api/productTypesApi";
import {
  setError,
  setItems,
  setLastLoadedAt,
  setLoading,
} from "./productTypesSlice";
import {
  selectProductTypesError,
  selectProductTypesItems,
  selectProductTypesLastLoadedAt,
  selectProductTypesStatus,
} from "./productTypesSelectors";

const DEFAULT_TTL = 300000;

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export function useProductTypesCrud() {
  const dispatch = useDispatch();
  const items = useSelector(selectProductTypesItems);
  const status = useSelector(selectProductTypesStatus);
  const error = useSelector(selectProductTypesError);
  const lastLoadedAt = useSelector(selectProductTypesLastLoadedAt);

  const loadList = useCallback(async () => {
    dispatch(setLoading());
    try {
      const data = await productTypesApi.list();
      dispatch(setItems(data));
      dispatch(setLastLoadedAt(Date.now()));
    } catch (err) {
      dispatch(
        setError(getErrorMessage(err, "Failed to load product types"))
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

  const createProductType = useCallback(
    async (payload) => {
      try {
        await productTypesApi.create(payload);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to create product type")));
        throw err;
      }
    },
    [reload, dispatch]
  );

  const updateProductType = useCallback(
    async (id, payload) => {
      try {
        await productTypesApi.update(id, payload);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to update product type")));
        throw err;
      }
    },
    [reload, dispatch]
  );

  const deleteProductType = useCallback(
    async (id) => {
      try {
        await productTypesApi.remove(id);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to delete product type")));
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
    createProductType,
    updateProductType,
    deleteProductType,
  };
}
