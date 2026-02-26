import React, { useEffect } from "react";
import { Alert, MenuItem, Stack, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import EditorDialog from "../../../../admin/crud/EditorDialog";
import { useProductTypeForm } from "../../../../forms/productType/useProductTypeForm";
import { useProductTypesCrud } from "../../../../features/admin/productTypes/useProductTypesCrud";
import { useAdminCategories } from "../../../../features/admin/categories/useAdminCategories";

export default function ProductTypeEditorDialog({ open, productType, onClose }) {
  const { createProductType, updateProductType } = useProductTypesCrud();
  const { data: categories, loading: categoriesLoading, error: categoriesError } =
    useAdminCategories();
  const {
    form,
    onSubmit,
    serverError,
    setServerError,
    isSubmitting,
    resetToDefault,
  } = useProductTypeForm();
  const {
    register,
    control,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      resetToDefault(productType);
    } else {
      setServerError(null);
    }
  }, [open, productType, resetToDefault, setServerError]);

  const handleSubmit = onSubmit(async (values) => {
    if (productType?.id) {
      await updateProductType(productType.id, values);
    } else {
      await createProductType(values);
    }
    onClose();
  });

  return (
    <EditorDialog
      open={open}
      title={productType ? "Edit Product Type" : "Create Product Type"}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <TextField
          label="Product type name"
          fullWidth
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
          autoFocus
        />
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              fullWidth
              label="Category"
              error={!!errors.categoryId}
              helperText={
                errors.categoryId?.message ||
                (categoriesError
                  ? categoriesError?.response?.data?.message ||
                    categoriesError?.message
                  : "")
              }
              disabled={categoriesLoading}
            >
              <MenuItem value="">Select category</MenuItem>
              {(categories || []).map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Stack>
    </EditorDialog>
  );
}
