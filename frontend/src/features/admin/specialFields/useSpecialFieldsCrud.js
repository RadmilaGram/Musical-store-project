import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import specialFieldsApi from "../../../api/specialFieldsApi";
import {
  setError,
  setItems,
  setLastLoadedAt,
  setLoading,
} from "./specialFieldsSlice";
import {
  selectSpecialFieldsError,
  selectSpecialFieldsItems,
  selectSpecialFieldsLastLoadedAt,
  selectSpecialFieldsStatus,
} from "./specialFieldsSelectors";

const DEFAULT_TTL = 300000;

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export function useSpecialFieldsCrud() {
  const dispatch = useDispatch();
  const items = useSelector(selectSpecialFieldsItems);
  const status = useSelector(selectSpecialFieldsStatus);
  const error = useSelector(selectSpecialFieldsError);
  const lastLoadedAt = useSelector(selectSpecialFieldsLastLoadedAt);

  const loadList = useCallback(async () => {
    dispatch(setLoading());
    try {
      const data = await specialFieldsApi.list();
      dispatch(setItems(data));
      dispatch(setLastLoadedAt(Date.now()));
    } catch (err) {
      dispatch(setError(getErrorMessage(err, "Failed to load special fields")));
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

  const createSpecialField = useCallback(
    async (payload) => {
      try {
        await specialFieldsApi.create(payload);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to create special field")));
        throw err;
      }
    },
    [reload, dispatch]
  );

  const updateSpecialField = useCallback(
    async (id, payload) => {
      try {
        await specialFieldsApi.update(id, payload);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to update special field")));
        throw err;
      }
    },
    [reload, dispatch]
  );

  const deleteSpecialField = useCallback(
    async (id) => {
      try {
        await specialFieldsApi.remove(id);
        await reload();
      } catch (err) {
        dispatch(setError(getErrorMessage(err, "Failed to delete special field")));
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
    createSpecialField,
    updateSpecialField,
    deleteSpecialField,
  };
}
