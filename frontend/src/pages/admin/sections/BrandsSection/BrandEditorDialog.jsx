import React, { useEffect } from "react";
import { Alert, Stack, TextField } from "@mui/material";
import EditorDialog from "../../../../admin/crud/EditorDialog";
import { useBrandForm } from "../../../../forms/brand/useBrandForm";
import { useBrandsCrud } from "../../../../features/admin/brands/useBrandsCrud";

export default function BrandEditorDialog({ open, brand, onClose }) {
  const { createBrand, updateBrand } = useBrandsCrud();
  const { form, onSubmit, serverError, setServerError, isSubmitting, resetToDefault } =
    useBrandForm();
  const {
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      resetToDefault(brand);
    } else {
      setServerError(null);
    }
  }, [open, brand, resetToDefault, setServerError]);

  const handleSubmit = onSubmit(async (values) => {
    if (brand?.id) {
      await updateBrand(brand.id, values);
    } else {
      await createBrand(values);
    }
    onClose();
  });

  return (
    <EditorDialog
      open={open}
      title={brand ? "Edit Brand" : "Create Brand"}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <TextField
          label="Brand name"
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
