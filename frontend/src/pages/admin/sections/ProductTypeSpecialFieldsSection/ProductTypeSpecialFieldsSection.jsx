import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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

const productTypeSpecialFieldsSchema = yup.object({
  productTypeId: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" ? NaN : Number(originalValue)
    )
    .typeError("Product type is required")
    .integer("Product type is required")
    .positive("Product type is required")
    .required("Product type is required"),
  assignedFieldIds: yup
    .array()
    .of(
      yup
        .number()
        .transform((value, originalValue) => Number(originalValue))
        .typeError("Invalid field id")
        .integer("Invalid field id")
        .positive("Invalid field id")
    ),
});

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
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(productTypeSpecialFieldsSchema),
    defaultValues: {
      productTypeId: "",
      assignedFieldIds: [],
    },
  });
  const productTypeId = useWatch({
    control,
    name: "productTypeId",
  });
  const assignedFieldIdsForm = useWatch({
    control,
    name: "assignedFieldIds",
  }) || [];

  const [searchValue, setSearchValue] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarError, setSnackbarError] = useState("");
  const [pendingTypeId, setPendingTypeId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    ensureProductTypes().catch(() => {});
    ensureSpecialFields().catch(() => {});
  }, [ensureProductTypes, ensureSpecialFields]);

  useEffect(() => {
    setValue("assignedFieldIds", assignedFieldIds, { shouldDirty: false });
  }, [assignedFieldIds, setValue]);

  useEffect(() => {
    if (productTypeId) {
      loadAssignments(productTypeId).catch(() => {});
    } else {
      setValue("assignedFieldIds", [], { shouldDirty: false });
    }
  }, [productTypeId, loadAssignments, setValue]);

  const hasChanges = useMemo(() => {
    if (!productTypeId) return false;
    if (assignedFieldIdsForm.length !== assignedFieldIds.length) return true;
    const a = [...assignedFieldIdsForm].sort();
    const b = [...assignedFieldIds].sort();
    return a.some((id, idx) => id !== b[idx]);
  }, [productTypeId, assignedFieldIdsForm, assignedFieldIds]);

  const handleTypeChangeConfirmed = useCallback(() => {
    setShowConfirm(false);
    setValue("productTypeId", pendingTypeId, { shouldDirty: false });
    setValue("assignedFieldIds", [], { shouldDirty: false });
    setPendingTypeId("");
  }, [pendingTypeId, setValue]);

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
        setValue("productTypeId", newTypeId, { shouldDirty: false });
        setValue("assignedFieldIds", [], { shouldDirty: false });
      }
    },
    [hasChanges, setValue]
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

  const handleSave = useCallback(async ({ productTypeId, assignedFieldIds }) => {
    if (!productTypeId) {
      return;
    }
    const normalizedAssignedIds = (assignedFieldIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);
    try {
      await saveAssignments(productTypeId, normalizedAssignedIds);
      reset(
        {
          productTypeId,
          assignedFieldIds: normalizedAssignedIds,
        },
        { keepDirty: false }
      );
      setSnackbarMessage("Assignments saved");
    } catch {
      setSnackbarError("Failed to save assignments");
    }
  }, [saveAssignments, reset]);

  const columns = useMemo(
    () => [
      {
        field: "checked",
        headerName: "",
        width: 80,
        renderCell: (params) => (
          <Controller
            name="assignedFieldIds"
            control={control}
            render={({ field }) => {
              const currentIds = Array.isArray(field.value) ? field.value : [];
              const isChecked = currentIds.includes(params.row.id);
              return (
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const nextIds = checked
                      ? currentIds.includes(params.row.id)
                        ? currentIds
                        : [...currentIds, params.row.id]
                      : currentIds.filter((id) => id !== params.row.id);
                    field.onChange(nextIds);
                  }}
                  disabled={!productTypeId || saving}
                />
              );
            }}
          />
        ),
      },
      { field: "name", headerName: "Name", flex: 1 },
      { field: "datatypeName", headerName: "Datatype", flex: 1 },
    ],
    [control, productTypeId, saving]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <EntityToolbar
        title="Product Type Fields"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={() => {}}
        onRefreshClick={() =>
          productTypeId ? loadAssignments(productTypeId) : Promise.resolve()
        }
        isRefreshing={loading}
        disableCreate
        filtersSlot={
          <Controller
            name="productTypeId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Product Type"
                onChange={handleTypeChange}
                error={Boolean(errors.productTypeId)}
                helperText={errors.productTypeId?.message}
              >
                <MenuItem value="">Select product type</MenuItem>
                {productTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        }
      />

      {assignmentError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {assignmentError}
        </Alert>
      )}

      {!productTypeId ? (
        <Alert severity="info">Select a product type to manage fields.</Alert>
      ) : (
        <>
          <CrudTable
            rows={filteredFields}
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
              onClick={handleSubmit(handleSave)}
              disabled={!hasChanges || saving || !productTypeId}
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
