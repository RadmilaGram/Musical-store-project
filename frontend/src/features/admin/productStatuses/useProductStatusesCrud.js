import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import productStatusesApi from "../../../api/productStatusesApi";
import {
  setError,
  setItems,
  setLastLoadedAt,
  setLoading,
} from "./productStatusesSlice";
import {
  selectProductStatusesError,
  selectProductStatusesItems,
  selectProductStatusesLastLoadedAt,
  selectProductStatusesStatus,
} from "./productStatusesSelectors";

const DEFAULT_TTL = 300000;

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export function useProductStatusesCrud() {
  const dispatch = useDispatch();
  const items = useSelector(selectProductStatusesItems);
  const status = useSelector(selectProductStatusesStatus);
  const error = useSelector(selectProductStatusesError);
  const lastLoadedAt = useSelector(selectProductStatusesLastLoadedAt);

  const loadList = useCallback(async () => {
    dispatch(setLoading());
    try {
      const data = await productStatusesApi.list();
      dispatch(setItems(data));
      dispatch(setLastLoadedAt(Date.now()));
    } catch (err) {
      dispatch(
        setError(getErrorMessage(err, "Failed to load product statuses"))
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

  const reload = useCallback(
    () => ensureLoaded({ force: true }),
    [ensureLoaded]
  );

  const createStatus = useCallback(
    async (payload) => {
      try {
        await productStatusesApi.create(payload);
        await reload();
      } catch (err) {
        dispatch(
          setError(getErrorMessage(err, "Failed to create product status"))
        );
        throw err;
      }
    },
    [reload, dispatch]
  );

  const updateStatus = useCallback(
    async (id, payload) => {
      try {
        await productStatusesApi.update(id, payload);
        await reload();
      } catch (err) {
        dispatch(
          setError(getErrorMessage(err, "Failed to update product status"))
        );
        throw err;
      }
    },
    [reload, dispatch]
  );

  const deleteStatus = useCallback(
    async (id) => {
      try {
        await productStatusesApi.remove(id);
        await reload();
      } catch (err) {
        dispatch(
          setError(getErrorMessage(err, "Failed to delete product status"))
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
    createStatus,
    updateStatus,
    deleteStatus,
  };
}
