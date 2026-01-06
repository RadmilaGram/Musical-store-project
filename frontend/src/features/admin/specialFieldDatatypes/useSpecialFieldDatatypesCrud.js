import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import specialFieldDatatypesApi from "../../../api/specialFieldDatatypesApi";
import {
  setError,
  setItems,
  setLastLoadedAt,
  setLoading,
} from "./specialFieldDatatypesSlice";
import {
  selectSpecialFieldDatatypeError,
  selectSpecialFieldDatatypeItems,
  selectSpecialFieldDatatypeLastLoadedAt,
  selectSpecialFieldDatatypeStatus,
} from "./specialFieldDatatypesSelectors";

const DEFAULT_TTL = 300000;

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export function useSpecialFieldDatatypesCrud() {
  const dispatch = useDispatch();
  const items = useSelector(selectSpecialFieldDatatypeItems);
  const status = useSelector(selectSpecialFieldDatatypeStatus);
  const error = useSelector(selectSpecialFieldDatatypeError);
  const lastLoadedAt = useSelector(selectSpecialFieldDatatypeLastLoadedAt);

  const loadList = useCallback(async () => {
    dispatch(setLoading());
    try {
      const data = await specialFieldDatatypesApi.list();
      dispatch(setItems(data));
      dispatch(setLastLoadedAt(Date.now()));
    } catch (err) {
      dispatch(
        setError(getErrorMessage(err, "Failed to load special field datatypes"))
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

  return {
    items,
    status,
    error,
    ensureLoaded,
    reload,
  };
}
