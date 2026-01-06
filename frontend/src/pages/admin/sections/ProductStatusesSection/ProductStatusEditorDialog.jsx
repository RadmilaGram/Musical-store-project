import React, { useEffect } from "react";
import { Alert, Stack, TextField } from "@mui/material";
import EditorDialog from "../../../../admin/crud/EditorDialog";
import { useProductStatusesCrud } from "../../../../features/admin/productStatuses/useProductStatusesCrud";
import { useProductStatusForm } from "../../../../forms/productStatus/useProductStatusForm";

export default function ProductStatusEditorDialog({ open, status, onClose }) {
  const { createStatus, updateStatus } = useProductStatusesCrud();
  const {
    form,
    onSubmit,
    serverError,
    setServerError,
    isSubmitting,
    resetToDefault,
  } = useProductStatusForm();
  const {
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      resetToDefault(status);
    } else {
      setServerError(null);
    }
  }, [open, status, resetToDefault, setServerError]);

  const handleSubmit = onSubmit(async (values) => {
    if (status?.id) {
      await updateStatus(status.id, values);
    } else {
      await createStatus(values);
    }
    onClose();
  });

  return (
    <EditorDialog
      open={open}
      title={status ? "Edit Status" : "Create Status"}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <TextField
          label="Status name"
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
