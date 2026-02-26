import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EntityToolbar from "../../../../admin/crud/EntityToolbar";
import CrudTable from "../../../../admin/crud/CrudTable";
import { useAdminCategories } from "../../../../features/admin/categories/useAdminCategories";
import { useSaveCategory } from "../../../../features/admin/categories/useSaveCategory";
import { useToggleCategoryActive } from "../../../../features/admin/categories/useToggleCategoryActive";
import CategoryEditorDialog from "./CategoryEditorDialog";
import { API_URL } from "../../../../utils/apiService/ApiService";

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

const toPreviewUrl = (img) => {
  if (!img) return null;
  const value = String(img);
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `${API_URL}${value}`;
};

export default function CategoriesSection() {
  const { data, loading, error, reload } = useAdminCategories();
  const { saveCategory } = useSaveCategory();
  const { toggleCategoryActive, isSubmitting: isToggling } =
    useToggleCategoryActive();

  const [searchValue, setSearchValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [actionError, setActionError] = useState(null);

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    if (!query) {
      return data || [];
    }
    return (data || []).filter((item) => {
      const name = item?.name?.toLowerCase() || "";
      const slug = item?.slug?.toLowerCase() || "";
      return name.includes(query) || slug.includes(query);
    });
  }, [data, searchValue]);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingCategory(null);
    setEditorOpen(true);
  }, []);

  const handleEdit = useCallback((category) => {
    setEditingCategory(category);
    setEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingCategory(null);
  }, []);

  const handleSave = useCallback(
    async (payload) => {
      await saveCategory(payload);
      await reload();
    },
    [saveCategory, reload]
  );

  const handleToggleActive = useCallback(
    async (row, checked) => {
      try {
        await toggleCategoryActive(row.id, checked);
        await reload();
      } catch (err) {
        setActionError(getErrorMessage(err, "Failed to update category"));
      }
    },
    [toggleCategoryActive, reload]
  );

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      {
        field: "img",
        headerName: "Image",
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const imageUrl = toPreviewUrl(params.row?.img);
          if (!imageUrl) {
            return (
              <Typography variant="body2" color="text.secondary">
                No image
              </Typography>
            );
          }
          return (
            <Box
              component="img"
              src={imageUrl}
              alt={params.row?.name || "Category"}
              sx={{
                width: 92,
                height: 52,
                objectFit: "contain",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            />
          );
        },
      },
      { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
      { field: "slug", headerName: "Slug", flex: 1, minWidth: 180 },
      {
        field: "sort_order",
        headerName: "Sort",
        width: 110,
        renderHeader: () => (
          <Tooltip title="Lower number shows first">
            <span>Sort</span>
          </Tooltip>
        ),
      },
      {
        field: "is_active",
        headerName: "Active",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Switch
            checked={Number(params.row?.is_active) === 1}
            onChange={(event) => handleToggleActive(params.row, event.target.checked)}
            disabled={isToggling}
          />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Edit">
              <span>
                <IconButton size="small" onClick={() => handleEdit(params.row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [handleEdit, handleToggleActive, isToggling]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <EntityToolbar
        title="Categories"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={handleCreate}
        onRefreshClick={() => reload()}
        isRefreshing={loading}
        createButtonLabel="Add Category"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(error, "Failed to load categories")}
        </Alert>
      )}

      <CrudTable rows={filteredRows} columns={columns} loading={loading} />

      <CategoryEditorDialog
        open={editorOpen}
        category={editingCategory}
        onClose={handleCloseEditor}
        onSave={handleSave}
      />

      <Snackbar
        open={Boolean(actionError)}
        autoHideDuration={5000}
        onClose={() => setActionError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setActionError(null)}
          sx={{ width: "100%" }}
        >
          {actionError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
