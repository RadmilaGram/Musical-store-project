import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import brandsApi from "../../../api/brandsApi";
import {
  setError,
  setItems,
  setLastLoadedAt,
  setLoading,
} from "./brandsSlice";
import {
  selectBrandsError,
  selectBrandsItems,
  selectBrandsLastLoadedAt,
  selectBrandsStatus,
} from "./brandsSelectors";

const DEFAULT_TTL = 300000;

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export function useBrandsCrud() {
  const dispatch = useDispatch();
  const items = useSelector(selectBrandsItems);
  const status = useSelector(selectBrandsStatus);
  const error = useSelector(selectBrandsError);
  const lastLoadedAt = useSelector(selectBrandsLastLoadedAt);

  const loadList = useCallback(async () => {
    dispatch(setLoading());
    try {
      const data = await brandsApi.list();
      dispatch(setItems(data));
      dispatch(setLastLoadedAt(Date.now()));
    } catch (err) {
      dispatch(setError(getErrorMessage(err, "Failed to load brands")));
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

  const createBrand = useCallback(
    async (payload) => {
      try {
        await brandsApi.create(payload);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to create brand")));
        throw err;
      }
    },
    [reload, dispatch]
  );

  const updateBrand = useCallback(
    async (id, payload) => {
      try {
        await brandsApi.update(id, payload);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to update brand")));
        throw err;
      }
    },
    [reload, dispatch]
  );

  const deleteBrand = useCallback(
    async (id) => {
      try {
        await brandsApi.remove(id);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to delete brand")));
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
    createBrand,
    updateBrand,
    deleteBrand,
  };
}
