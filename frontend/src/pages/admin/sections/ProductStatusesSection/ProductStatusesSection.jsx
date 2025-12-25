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
import { useProductStatusesCrud } from "../../../../features/admin/productStatuses/useProductStatusesCrud";
import ProductStatusEditorDialog from "./ProductStatusEditorDialog";

const getErrorMessage = (error, fallback = "Failed to delete status") =>
  error?.response?.data?.message || error?.message || fallback;

export default function ProductStatusesSection() {
  const {
    items,
    status,
    error,
    ensureLoaded,
    reload,
    deleteStatus,
  } = useProductStatusesCrud();
  const [searchValue, setSearchValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    ensureLoaded().catch(() => {});
  }, [ensureLoaded]);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleCreateClick = useCallback(() => {
    setEditingStatus(null);
    setEditorOpen(true);
  }, []);

  const handleEditRequest = useCallback((item) => {
    setEditingStatus(item);
    setEditorOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((item) => {
    setStatusToDelete(item);
    setDeleteError(null);
    setConfirmOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingStatus(null);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setStatusToDelete(null);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!statusToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteStatus(statusToDelete.id);
      closeConfirm();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setIsDeleting(false);
    }
  }, [statusToDelete, deleteStatus, closeConfirm]);

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      item.name?.toLowerCase().includes(query)
    );
  }, [items, searchValue]);

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      { field: "name", headerName: "Name", flex: 1 },
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
    [handleEditRequest, handleDeleteRequest]
  );

  const isLoading = status === "loading";

  return (
    <Box sx={{ mb: 4, maxWidth: 900, mx: "auto" }}>
      <EntityToolbar
        title="Product Statuses"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={handleCreateClick}
        onRefreshClick={() => reload()}
        isRefreshing={isLoading}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <CrudTable rows={filteredRows} columns={columns} loading={isLoading} />

      <ProductStatusEditorDialog
        open={editorOpen}
        status={editingStatus}
        onClose={closeEditor}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete status"
        description={
          statusToDelete
            ? `Are you sure you want to delete "${statusToDelete.name}"?`
            : "Are you sure you want to delete this status?"
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
