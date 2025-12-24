import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Box, Snackbar } from "@mui/material";
import EntityToolbar from "../../../../admin/crud/EntityToolbar";
import CrudTable from "../../../../admin/crud/CrudTable";
import RowActions from "../../../../admin/crud/RowActions";
import ConfirmDialog from "../../../../admin/crud/ConfirmDialog";
import { useSpecialFieldDatatypesCrud } from "../../../../features/admin/specialFieldDatatypes/useSpecialFieldDatatypesCrud";
import { useSpecialFieldsCrud } from "../../../../features/admin/specialFields/useSpecialFieldsCrud";
import SpecialFieldEditorDrawer from "./SpecialFieldEditorDrawer";

const getErrorMessage = (
  error,
  fallback = "Failed to delete special field"
) => error?.response?.data?.message || error?.message || fallback;

export default function SpecialFieldsSection() {
  const {
    items: datatypeItems,
    ensureLoaded: ensureDatatypes,
    status: datatypesStatus,
    error: datatypesError,
  } = useSpecialFieldDatatypesCrud();
  const {
    items,
    status,
    error,
    ensureLoaded,
    reload,
    deleteSpecialField,
  } = useSpecialFieldsCrud();

  const [searchValue, setSearchValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    ensureDatatypes().catch(() => {});
  }, [ensureDatatypes]);

  useEffect(() => {
    ensureLoaded().catch(() => {});
  }, [ensureLoaded]);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleCreateClick = useCallback(() => {
    setEditingField(null);
    setEditorOpen(true);
  }, []);

  const handleEditRequest = useCallback((field) => {
    setEditingField(field);
    setEditorOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((field) => {
    setFieldToDelete(field);
    setDeleteError(null);
    setConfirmOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingField(null);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setFieldToDelete(null);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!fieldToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteSpecialField(fieldToDelete.id);
      closeConfirm();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setIsDeleting(false);
    }
  }, [deleteSpecialField, fieldToDelete, closeConfirm]);

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((field) =>
      field.name?.toLowerCase().includes(query)
    );
  }, [items, searchValue]);

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      { field: "name", headerName: "Name", flex: 1 },
      {
        field: "datatypeName",
        headerName: "Datatype",
        flex: 1,
        valueGetter: (params) =>
          (params?.row && params.row.datatypeName) || "—",
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <RowActions
            onEdit={() => handleEditRequest(params.row)}
            onDelete={() => handleDeleteRequest(params.row)}
          />
        ),
      },
    ],
    [handleDeleteRequest, handleEditRequest]
  );

  const isLoading = status === "loading" || datatypesStatus === "loading";

  return (
    <Box sx={{ mb: 4, maxWidth: 900, mx: "auto" }}>
      <EntityToolbar
        title="Special Fields"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={handleCreateClick}
        onRefreshClick={() => reload()}
        isRefreshing={isLoading}
      />

      {(error || datatypesError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || datatypesError}
        </Alert>
      )}

      <CrudTable rows={filteredRows} columns={columns} loading={isLoading} />

      <SpecialFieldEditorDrawer
        open={editorOpen}
        field={editingField}
        datatypes={datatypeItems}
        onClose={closeEditor}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete special field"
        description={
          fieldToDelete
            ? `Delete "${fieldToDelete.name}"?`
            : "Are you sure you want to delete this special field?"
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
