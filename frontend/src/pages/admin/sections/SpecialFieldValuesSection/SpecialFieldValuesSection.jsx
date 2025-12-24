import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import EntityToolbar from "../../../../admin/crud/EntityToolbar";
import CrudTable from "../../../../admin/crud/CrudTable";
import RowActions from "../../../../admin/crud/RowActions";
import ConfirmDialog from "../../../../admin/crud/ConfirmDialog";
import { useSpecialFieldsCrud } from "../../../../features/admin/specialFields/useSpecialFieldsCrud";
import useSpecialFieldValues from "../../../../features/admin/specialFieldValues/useSpecialFieldValues";
import SpecialFieldValueEditorDialog from "./SpecialFieldValueEditorDialog";

const getErrorMessage = (error, fallback = "Failed to delete value") =>
  error?.response?.data?.message || error?.message || fallback;

export default function SpecialFieldValuesSection() {
  const {
    items: specialFields,
    ensureLoaded: ensureFields,
    status: fieldsStatus,
    error: fieldsError,
  } = useSpecialFieldsCrud();

  const [selectedFieldId, setSelectedFieldId] = useState("");
  const {
    items: values,
    loading,
    error,
    reload,
    createValue,
    updateValue,
    deleteValue,
  } = useSpecialFieldValues(selectedFieldId);

  const [searchValue, setSearchValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    ensureFields().catch(() => {});
  }, [ensureFields]);

  const handleFieldChange = useCallback((event) => {
    setSelectedFieldId(event.target.value);
  }, []);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingValue(null);
    setEditorOpen(true);
  }, []);

  const handleEdit = useCallback((value) => {
    setEditingValue(value);
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingValue(null);
  }, []);

  const openDeleteConfirm = useCallback((value) => {
    setPendingDelete(value);
    setDeleteError(null);
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setPendingDelete(null);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteValue(pendingDelete);
      closeConfirm();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setIsDeleting(false);
    }
  }, [pendingDelete, deleteValue, closeConfirm]);

  const handleSubmitValue = useCallback(
    async (newValue) => {
      if (!selectedFieldId) return;
      if (editingValue) {
        await updateValue(editingValue, newValue);
      } else {
        await createValue(newValue);
      }
    },
    [selectedFieldId, editingValue, updateValue, createValue]
  );

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    const list = values || [];
    if (!query) {
      return list.map((entry) => ({ id: entry.value, value: entry.value }));
    }
    return list
      .filter((entry) => entry.value?.toLowerCase().includes(query))
      .map((entry) => ({ id: entry.value, value: entry.value }));
  }, [values, searchValue]);

  const columns = useMemo(
    () => [
      { field: "value", headerName: "Value", flex: 1 },
      {
        field: "actions",
        headerName: "Actions",
        width: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <RowActions
            onEdit={() => handleEdit(params.row.value)}
            onDelete={() => openDeleteConfirm(params.row.value)}
          />
        ),
      },
    ],
    [handleEdit, openDeleteConfirm]
  );

  const isLoading = loading || fieldsStatus === "loading";

  return (
    <Box sx={{ mb: 4, maxWidth: 900, mx: "auto" }}>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          select
          fullWidth
          label="Special Field"
          value={selectedFieldId}
          onChange={handleFieldChange}
        >
          <MenuItem value="">Select field</MenuItem>
          {specialFields.map((field) => (
            <MenuItem key={field.id} value={field.id}>
              {field.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <EntityToolbar
        title="Special Field Values"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={handleCreate}
        onRefreshClick={() => reload()}
        isRefreshing={isLoading}
        disableCreate={!selectedFieldId}
      />

      {(error || fieldsError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || fieldsError}
        </Alert>
      )}

      <CrudTable
        rows={selectedFieldId ? filteredRows : []}
        columns={columns}
        loading={isLoading}
      />

      <SpecialFieldValueEditorDialog
        open={editorOpen}
        value={editingValue}
        onClose={closeEditor}
        onSubmit={handleSubmitValue}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete value"
        description={
          pendingDelete
            ? `Delete "${pendingDelete}"?`
            : "Are you sure you want to delete this value?"
        }
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onClose={closeConfirm}
        loading={isDeleting}
      />

      <Snackbar
        open={Boolean(deleteError)}
        autoHideDuration={5000}
        onClose={() => setDeleteError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setDeleteError(null)}
          sx={{ width: "100%" }}
        >
          {deleteError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
