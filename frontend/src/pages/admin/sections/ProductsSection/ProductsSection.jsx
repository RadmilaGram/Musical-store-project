import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Box,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
} from "@mui/material";
import EntityToolbar from "../../../../admin/crud/EntityToolbar";
import CrudTable from "../../../../admin/crud/CrudTable";
import RowActions from "../../../../admin/crud/RowActions";
import ConfirmDialog from "../../../../admin/crud/ConfirmDialog";
import { useProductsCrud } from "../../../../features/admin/products/useProductsCrud";
import { useBrandsCrud } from "../../../../features/admin/brands/useBrandsCrud";
import { useProductTypesCrud } from "../../../../features/admin/productTypes/useProductTypesCrud";
import { useProductStatusesCrud } from "../../../../features/admin/productStatuses/useProductStatusesCrud";
import { useSpecialFieldsCrud } from "../../../../features/admin/specialFields/useSpecialFieldsCrud";
import ProductEditorDrawer from "./ProductEditorDrawer";

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export default function ProductsSection() {
  const {
    items: products,
    status: productsStatus,
    error: productsError,
    ensureLoaded: ensureProductsLoaded,
    reload: reloadProducts,
    deleteProduct,
    createProduct,
    updateProduct,
  } = useProductsCrud();
  const {
    items: brands,
    ensureLoaded: ensureBrandsLoaded,
  } = useBrandsCrud();
  const {
    items: productTypes,
    ensureLoaded: ensureProductTypesLoaded,
  } = useProductTypesCrud();
  const {
    items: productStatuses,
    ensureLoaded: ensureProductStatusesLoaded,
  } = useProductStatusesCrud();
  const {
    items: specialFields,
    ensureLoaded: ensureSpecialFieldsLoaded,
  } = useSpecialFieldsCrud();

  const [searchValue, setSearchValue] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    ensureProductsLoaded().catch(() => {});
  }, [ensureProductsLoaded]);

  useEffect(() => {
    ensureBrandsLoaded().catch(() => {});
  }, [ensureBrandsLoaded]);

  useEffect(() => {
    ensureProductTypesLoaded().catch(() => {});
  }, [ensureProductTypesLoaded]);

  useEffect(() => {
    ensureProductStatusesLoaded().catch(() => {});
  }, [ensureProductStatusesLoaded]);

  useEffect(() => {
    ensureSpecialFieldsLoaded().catch(() => {});
  }, [ensureSpecialFieldsLoaded]);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleCreateClick = useCallback(() => {
    setEditingProduct(null);
    setEditorOpen(true);
  }, []);

  const handleEditRequest = useCallback((product) => {
    setEditingProduct(product);
    setEditorOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((product) => {
    setProductToDelete(product);
    setDeleteError(null);
    setConfirmOpen(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingProduct(null);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setProductToDelete(null);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      closeConfirm();
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Failed to delete product"));
      setIsDeleting(false);
    }
  }, [productToDelete, deleteProduct, closeConfirm]);

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    return (products || []).filter((product) => {
      if (query && !product.name?.toLowerCase().includes(query)) {
        return false;
      }
      if (brandFilter && String(product.brandId) !== brandFilter) {
        return false;
      }
      if (typeFilter && String(product.typeId) !== typeFilter) {
        return false;
      }
      if (statusFilter && String(product.statusId) !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [products, searchValue, brandFilter, typeFilter, statusFilter]);

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      { field: "name", headerName: "Name", flex: 1, minWidth: 150 },
      { field: "brandName", headerName: "Brand", flex: 1, minWidth: 140 },
      { field: "typeName", headerName: "Type", flex: 1, minWidth: 140 },
      { field: "statusName", headerName: "Status", flex: 1, minWidth: 140 },
      {
        field: "price",
        headerName: "Price",
        width: 130,
        valueFormatter: ({ value }) =>
          typeof value === "number"
            ? `$${value.toFixed(2)}`
            : value
            ? `$${Number(value).toFixed(2)}`
            : "—",
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
    [handleEditRequest, handleDeleteRequest]
  );

  const isLoading = productsStatus === "loading";

  const filtersSlot = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{ width: "100%" }}
    >
      <TextField
        select
        label="Brand"
        value={brandFilter}
        onChange={(event) => setBrandFilter(event.target.value)}
        fullWidth
      >
        <MenuItem value="">All brands</MenuItem>
        {brands.map((brand) => (
          <MenuItem key={brand.id} value={String(brand.id)}>
            {brand.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Product Type"
        value={typeFilter}
        onChange={(event) => setTypeFilter(event.target.value)}
        fullWidth
      >
        <MenuItem value="">All types</MenuItem>
        {productTypes.map((type) => (
          <MenuItem key={type.id} value={String(type.id)}>
            {type.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Status"
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        fullWidth
      >
        <MenuItem value="">All statuses</MenuItem>
        {productStatuses.map((status) => (
          <MenuItem key={status.id} value={String(status.id)}>
            {status.name}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );

  return (
    <Box sx={{ mb: 4, maxWidth: 1100, mx: "auto" }}>
      <EntityToolbar
        title="Products"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={handleCreateClick}
        onRefreshClick={() => reloadProducts()}
        isRefreshing={isLoading}
        filtersSlot={filtersSlot}
      />

      {productsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {productsError}
        </Alert>
      )}

      <CrudTable rows={filteredRows} columns={columns} loading={isLoading} />

      <ProductEditorDrawer
        open={editorOpen}
        product={editingProduct}
        onClose={handleCloseEditor}
        brands={brands}
        productTypes={productTypes}
        productStatuses={productStatuses}
        specialFieldsCatalog={specialFields}
        onCreate={createProduct}
        onUpdate={updateProduct}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete product"
        description={
          productToDelete
            ? `Are you sure you want to delete "${productToDelete.name}"?`
            : "Are you sure you want to delete this product?"
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
