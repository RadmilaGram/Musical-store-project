import { useCallback, useState } from "react";
import { productTypeSpecialFieldAssignmentsApi } from "../../../api/productTypeSpecialFieldAssignmentsApi";

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export function useProductTypeSpecialFieldAssignment() {
  const [assignedFieldIds, setAssignedFieldIds] = useState([]);
  const [initialAssignedFieldIds, setInitialAssignedFieldIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadAssignments = useCallback(async (typeId) => {
    if (!typeId) {
      setAssignedFieldIds([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data =
        (await productTypeSpecialFieldAssignmentsApi.getAssignments(typeId)) ||
        {};
      const ids = data.assignedFieldIds || [];
      setAssignedFieldIds(ids);
      setInitialAssignedFieldIds(ids);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load assignments"));
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAssignments = useCallback(
    async (typeId, fieldIds) => {
      if (!typeId) return;
      setSaving(true);
      setError(null);
      try {
        await productTypeSpecialFieldAssignmentsApi.setAssignments(
          typeId,
          fieldIds
        );
        setAssignedFieldIds(fieldIds);
        setInitialAssignedFieldIds(fieldIds);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to save assignments"));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    assignedFieldIds,
    initialAssignedFieldIds,
    loading,
    saving,
    error,
    loadAssignments,
    saveAssignments,
  };
}

export default useProductTypeSpecialFieldAssignment;
