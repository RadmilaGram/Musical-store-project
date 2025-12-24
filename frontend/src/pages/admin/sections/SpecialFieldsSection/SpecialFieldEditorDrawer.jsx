import React, { useEffect } from "react";
import {
  Alert,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";
import EditorDrawer from "../../../../admin/crud/EditorDrawer";
import { useSpecialFieldForm } from "../../../../forms/specialField/useSpecialFieldForm";
import { useSpecialFieldsCrud } from "../../../../features/admin/specialFields/useSpecialFieldsCrud";

export default function SpecialFieldEditorDrawer({
  open,
  field,
  datatypes,
  onClose,
}) {
  const { createSpecialField, updateSpecialField } = useSpecialFieldsCrud();
  const {
    form,
    onSubmit,
    serverError,
    setServerError,
    isSubmitting,
    resetToDefault,
  } = useSpecialFieldForm();
  const {
    register,
    control,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      resetToDefault(field);
    } else {
      setServerError(null);
    }
  }, [open, field, resetToDefault, setServerError]);

  const handleSubmit = onSubmit(async (values) => {
    if (field?.id) {
      await updateSpecialField(field.id, values);
    } else {
      await createSpecialField(values);
    }
    onClose();
  });

  return (
    <EditorDrawer
      open={open}
      title={field ? "Edit Special Field" : "Create Special Field"}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <Stack spacing={2}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <TextField
          label="Name"
          fullWidth
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
          autoFocus
        />
        <Controller
          name="datatypeId"
          control={control}
          render={({ field: ctrlField }) => (
            <TextField
              {...ctrlField}
              select
              label="Datatype"
              fullWidth
              error={!!errors.datatypeId}
              helperText={errors.datatypeId?.message}
            >
              <MenuItem value="">
                <Typography color="text.secondary">
                  Select datatype
                </Typography>
              </MenuItem>
              {datatypes.map((dt) => (
                <MenuItem key={dt.id} value={dt.id}>
                  {dt.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Stack>
    </EditorDrawer>
  );
}
