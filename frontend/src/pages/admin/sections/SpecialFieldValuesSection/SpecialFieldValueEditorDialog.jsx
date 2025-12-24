import React, { useEffect } from "react";
import { Alert, Stack, TextField } from "@mui/material";
import EditorDialog from "../../../../admin/crud/EditorDialog";
import { useSpecialFieldValueForm } from "../../../../forms/specialFieldValue/useSpecialFieldValueForm";

export default function SpecialFieldValueEditorDialog({
  open,
  value,
  onClose,
  onSubmit,
}) {
  const { form, onSubmit: handleSubmitFactory, serverError, setServerError, isSubmitting, resetToDefault } =
    useSpecialFieldValueForm();
  const {
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      resetToDefault(value || "");
    } else {
      setServerError(null);
    }
  }, [open, value, resetToDefault, setServerError]);

  const handleSubmit = handleSubmitFactory(async (newValue) => {
    await onSubmit(newValue);
    onClose();
  });

  return (
    <EditorDialog
      open={open}
      title={value ? "Edit Value" : "Add Value"}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <TextField
          label="Value"
          fullWidth
          {...register("value")}
          error={!!errors.value}
          helperText={errors.value?.message}
          autoFocus
        />
      </Stack>
    </EditorDialog>
  );
}
