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
import { useBrandsCrud } from "../../../../features/admin/brands/useBrandsCrud";
import BrandEditorDialog from "./BrandEditorDialog";

const getErrorMessage = (error, fallback = "Failed to delete brand") =>
  error?.response?.data?.message || error?.message || fallback;

export default function BrandsSection() {
  const { items, status, error, ensureLoaded, reload, deleteBrand } =
    useBrandsCrud();
  const [searchValue, setSearchValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    ensureLoaded().catch(() => {});
  }, [ensureLoaded]);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleCreateClick = useCallback(() => {
    setEditingBrand(null);
    setEditorOpen(true);
  }, []);

  const handleEditRequest = useCallback((brand) => {
    setEditingBrand(brand);
    setEditorOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((brand) => {
    setBrandToDelete(brand);
    setDeleteError(null);
    setConfirmOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingBrand(null);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setBrandToDelete(null);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!brandToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteBrand(brandToDelete.id);
      closeConfirm();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setIsDeleting(false);
    }
  }, [brandToDelete, deleteBrand, closeConfirm]);

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((brand) =>
      brand.name?.toLowerCase().includes(query)
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
    <Box sx={{ width: "100%" }}>
      <EntityToolbar
        title="Brands"
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

      <BrandEditorDialog
        open={editorOpen}
        brand={editingBrand}
        onClose={closeEditor}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete brand"
        description={
          brandToDelete
            ? `Are you sure you want to delete "${brandToDelete.name}"?`
            : "Are you sure you want to delete this brand?"
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
