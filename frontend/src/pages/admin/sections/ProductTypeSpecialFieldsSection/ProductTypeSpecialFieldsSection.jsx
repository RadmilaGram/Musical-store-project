import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import EntityToolbar from "../../../../admin/crud/EntityToolbar";
import CrudTable from "../../../../admin/crud/CrudTable";
import { useProductTypesCrud } from "../../../../features/admin/productTypes/useProductTypesCrud";
import { useSpecialFieldsCrud } from "../../../../features/admin/specialFields/useSpecialFieldsCrud";
import { useProductTypeSpecialFieldAssignment } from "../../../../features/admin/productTypeSpecialFields/useProductTypeSpecialFieldAssignment";

export default function ProductTypeSpecialFieldsSection() {
  const { items: productTypes, ensureLoaded: ensureProductTypes } =
    useProductTypesCrud();
  const { items: specialFields, ensureLoaded: ensureSpecialFields } =
    useSpecialFieldsCrud();
  const {
    assignedFieldIds,
    initialAssignedFieldIds,
    loading,
    saving,
    error: assignmentError,
    loadAssignments,
    saveAssignments,
  } = useProductTypeSpecialFieldAssignment();

  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarError, setSnackbarError] = useState("");
  const [localAssignedIds, setLocalAssignedIds] = useState([]);
  const [pendingTypeId, setPendingTypeId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    ensureProductTypes().catch(() => {});
    ensureSpecialFields().catch(() => {});
  }, [ensureProductTypes, ensureSpecialFields]);

  useEffect(() => {
    setLocalAssignedIds(assignedFieldIds);
  }, [assignedFieldIds]);

  useEffect(() => {
    if (selectedTypeId) {
      loadAssignments(selectedTypeId).catch(() => {});
    } else {
      setLocalAssignedIds([]);
    }
  }, [selectedTypeId, loadAssignments]);

  const hasChanges = useMemo(() => {
    if (!selectedTypeId) return false;
    if (localAssignedIds.length !== assignedFieldIds.length) return true;
    const a = [...localAssignedIds].sort();
    const b = [...assignedFieldIds].sort();
    return a.some((id, idx) => id !== b[idx]);
  }, [selectedTypeId, localAssignedIds, assignedFieldIds]);

  const handleTypeChangeConfirmed = useCallback(() => {
    setShowConfirm(false);
    setSelectedTypeId(pendingTypeId);
    setPendingTypeId("");
  }, [pendingTypeId]);

  const handleTypeChangeCanceled = useCallback(() => {
    setShowConfirm(false);
    setPendingTypeId("");
  }, []);

  const handleTypeChange = useCallback(
    (event) => {
      const newTypeId = event.target.value;
      if (hasChanges) {
        setPendingTypeId(newTypeId);
        setShowConfirm(true);
      } else {
        setSelectedTypeId(newTypeId);
      }
    },
    [hasChanges]
  );

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const filteredFields = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    const base = specialFields || [];
    return query
      ? base.filter((field) => field.name?.toLowerCase().includes(query))
      : base;
  }, [specialFields, searchValue]);

  const rows = useMemo(
    () =>
      filteredFields.map((field) => ({
        ...field,
        checked: localAssignedIds.includes(field.id),
      })),
    [filteredFields, localAssignedIds]
  );

  const handleToggle = useCallback(
    (fieldId, checked) => {
      if (checked) {
        if (!localAssignedIds.includes(fieldId)) {
          setLocalAssignedIds([...localAssignedIds, fieldId]);
        }
      } else {
        if (localAssignedIds.includes(fieldId)) {
          setLocalAssignedIds(localAssignedIds.filter((id) => id !== fieldId));
        }
      }
    },
    [localAssignedIds]
  );

  const handleSave = useCallback(async () => {
    if (!selectedTypeId) {
      return;
    }
    try {
      await saveAssignments(selectedTypeId, localAssignedIds);
      setSnackbarMessage("Assignments saved");
    } catch {
      setSnackbarError("Failed to save assignments");
    }
  }, [selectedTypeId, localAssignedIds, saveAssignments]);

  const columns = useMemo(
    () => [
      {
        field: "checked",
        headerName: "",
        width: 80,
        renderCell: (params) => (
          <input
            type="checkbox"
            checked={params.row.checked}
            onChange={(e) => handleToggle(params.row.id, e.target.checked)}
            disabled={!selectedTypeId || saving}
          />
        ),
      },
      { field: "name", headerName: "Name", flex: 1 },
      { field: "datatypeName", headerName: "Datatype", flex: 1 },
    ],
    [handleToggle, selectedTypeId, saving]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <EntityToolbar
        title="Product Type Fields"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={() => {}}
        onRefreshClick={() =>
          selectedTypeId ? loadAssignments(selectedTypeId) : Promise.resolve()
        }
        isRefreshing={loading}
        disableCreate
        filtersSlot={
          <TextField
            select
            fullWidth
            label="Product Type"
            value={selectedTypeId}
            onChange={handleTypeChange}
          >
            <MenuItem value="">Select product type</MenuItem>
            {productTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {assignmentError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {assignmentError}
        </Alert>
      )}

      {!selectedTypeId ? (
        <Alert severity="info">Select a product type to manage fields.</Alert>
      ) : (
        <>
          <CrudTable
            rows={rows}
            columns={columns}
            loading={loading || saving}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasChanges || saving || !selectedTypeId}
              startIcon={saving ? <CircularProgress size={18} /> : null}
            >
              Save
            </Button>
          </Box>
        </>
      )}

      <Dialog open={showConfirm} onClose={handleTypeChangeCanceled}>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Change product type anyway?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTypeChangeCanceled}>Cancel</Button>
          <Button onClick={handleTypeChangeConfirmed}>Discard</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage("")}
      >
        <Alert severity="success" onClose={() => setSnackbarMessage("")}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(snackbarError)}
        autoHideDuration={4000}
        onClose={() => setSnackbarError("")}
      >
        <Alert severity="error" onClose={() => setSnackbarError("")}>
          {snackbarError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
