import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Box, MenuItem, Snackbar, TextField } from "@mui/material";
import EntityToolbar from "../../../../admin/crud/EntityToolbar";
import CrudTable from "../../../../admin/crud/CrudTable";
import RowActions from "../../../../admin/crud/RowActions";
import ConfirmDialog from "../../../../admin/crud/ConfirmDialog";
import { useSpecialFieldDatatypesCrud } from "../../../../features/admin/specialFieldDatatypes/useSpecialFieldDatatypesCrud";
import { useSpecialFieldsCrud } from "../../../../features/admin/specialFields/useSpecialFieldsCrud";
import { useProductTypesCrud } from "../../../../features/admin/productTypes/useProductTypesCrud";
import { productTypeSpecialFieldsApi } from "../../../../api/productTypeSpecialFieldsApi";
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
  const { items: productTypes, ensureLoaded: ensureProductTypes } =
    useProductTypesCrud();

  const [searchValue, setSearchValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [assignedFields, setAssignedFields] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState(null);

  useEffect(() => {
    ensureDatatypes().catch(() => {});
  }, [ensureDatatypes]);

  useEffect(() => {
    ensureLoaded().catch(() => {});
  }, [ensureLoaded]);

  useEffect(() => {
    ensureProductTypes().catch(() => {});
  }, [ensureProductTypes]);

  const loadAssignedFields = useCallback(async () => {
    if (!selectedTypeId) {
      setAssignedFields([]);
      setAssignedError(null);
      return;
    }
    setAssignedLoading(true);
    setAssignedError(null);
    try {
      const data = await productTypeSpecialFieldsApi.listByType(
        selectedTypeId
      );
      setAssignedFields(data || []);
    } catch (err) {
      setAssignedError(getErrorMessage(err, "Failed to load special fields"));
    } finally {
      setAssignedLoading(false);
    }
  }, [selectedTypeId]);

  useEffect(() => {
    loadAssignedFields().catch(() => {});
  }, [loadAssignedFields]);

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

  const displayedFields = selectedTypeId ? assignedFields : items;

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    const base = displayedFields || [];
    const filtered = query
      ? base.filter((field) => field.name?.toLowerCase().includes(query))
      : base;
    return filtered;
  }, [displayedFields, searchValue]);

  const datatypeMap = useMemo(() => {
    const map = {};
    datatypeItems.forEach((dt) => {
      map[dt.id] = dt.name;
    });
    return map;
  }, [datatypeItems]);

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      { field: "name", headerName: "Name", flex: 1 },
      { field: "datatypeDisplay", headerName: "Datatype", flex: 1 },
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

  const tableRows = useMemo(
    () =>
      filteredRows.map((field) => ({
        ...field,
        datatypeDisplay:
          field.datatypeName ||
          datatypeMap[field.datatypeId] ||
          "—",
      })),
    [filteredRows, datatypeMap]
  );

  const isLoading =
    status === "loading" ||
    datatypesStatus === "loading" ||
    (Boolean(selectedTypeId) && assignedLoading);

  const handleTypeFilterChange = useCallback((event) => {
    setSelectedTypeId(event.target.value);
    setAssignedFields([]);
    setAssignedError(null);
  }, []);

  const handleRefresh = useCallback(() => {
    if (selectedTypeId) {
      loadAssignedFields();
    } else {
      reload();
    }
  }, [selectedTypeId, loadAssignedFields, reload]);

  return (
    <Box sx={{ width: "100%" }}>
      <EntityToolbar
        title="Special Fields"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={handleCreateClick}
        onRefreshClick={handleRefresh}
        isRefreshing={isLoading}
        filtersSlot={
          <TextField
            select
            fullWidth
            label="Product Type"
            value={selectedTypeId}
            onChange={handleTypeFilterChange}
          >
            <MenuItem value="">All types</MenuItem>
            {productTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {(error || datatypesError || assignedError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || datatypesError || assignedError}
        </Alert>
      )}

      <CrudTable rows={tableRows} columns={columns} loading={isLoading} />

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
