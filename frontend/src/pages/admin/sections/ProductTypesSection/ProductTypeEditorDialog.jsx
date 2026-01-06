import React, { useEffect } from "react";
import { Alert, Stack, TextField } from "@mui/material";
import EditorDialog from "../../../../admin/crud/EditorDialog";
import { useProductTypeForm } from "../../../../forms/productType/useProductTypeForm";
import { useProductTypesCrud } from "../../../../features/admin/productTypes/useProductTypesCrud";

export default function ProductTypeEditorDialog({ open, productType, onClose }) {
  const { createProductType, updateProductType } = useProductTypesCrud();
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
      </Stack>
    </EditorDialog>
  );
}
