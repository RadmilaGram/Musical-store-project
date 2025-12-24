import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Box } from "@mui/material";
import EntityToolbar from "../../../../admin/crud/EntityToolbar";
import CrudTable from "../../../../admin/crud/CrudTable";
import RowActions from "../../../../admin/crud/RowActions";
import ConfirmDialog from "../../../../admin/crud/ConfirmDialog";
import { useProductTypesCrud } from "../../../../features/admin/productTypes/useProductTypesCrud";
import ProductTypeEditorDialog from "./ProductTypeEditorDialog";

export default function ProductTypesSection() {
  const {
    items,
    status,
    error,
    ensureLoaded,
    reload,
    deleteProductType,
  } = useProductTypesCrud();
  const [searchValue, setSearchValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    ensureLoaded().catch(() => {});
  }, [ensureLoaded]);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleCreateClick = useCallback(() => {
    setEditingType(null);
    setEditorOpen(true);
  }, []);

  const handleEditRequest = useCallback((type) => {
    setEditingType(type);
    setEditorOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((type) => {
    setTypeToDelete(type);
    setConfirmOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingType(null);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setTypeToDelete(null);
    setIsDeleting(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!typeToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteProductType(typeToDelete.id);
      closeConfirm();
    } catch (err) {
      setIsDeleting(false);
    }
  }, [deleteProductType, typeToDelete, closeConfirm]);

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((type) => type.name?.toLowerCase().includes(query));
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
    [handleDeleteRequest, handleEditRequest]
  );

  const isLoading = status === "loading";

  return (
    <Box sx={{ mb: 4, maxWidth: 900, mx: "auto" }}>
      <EntityToolbar
        title="Product Types"
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

      <ProductTypeEditorDialog
        open={editorOpen}
        productType={editingType}
        onClose={closeEditor}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete product type"
        description={
          typeToDelete
            ? `Delete "${typeToDelete.name}"?`
            : "Are you sure you want to delete this product type?"
        }
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onClose={closeConfirm}
        loading={isDeleting}
      />
    </Box>
  );
}
