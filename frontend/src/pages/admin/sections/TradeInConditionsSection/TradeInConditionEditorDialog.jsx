import React, { useEffect } from "react";
import { Alert, Stack, TextField } from "@mui/material";
import EditorDialog from "../../../../admin/crud/EditorDialog";
import { useTradeInConditionsCrud } from "../../../../features/admin/tradeInConditions/useTradeInConditionsCrud";
import { useTradeInConditionForm } from "../../../../forms/tradeInCondition/useTradeInConditionForm";

export default function TradeInConditionEditorDialog({
  open,
  condition,
  onClose,
}) {
  const { createCondition, updateCondition } = useTradeInConditionsCrud();
  const {
    form,
    onSubmit,
    serverError,
    setServerError,
    isSubmitting,
    resetToDefault,
  } = useTradeInConditionForm({ isEdit: !!condition?.code });
  const {
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      resetToDefault(condition);
    } else {
      setServerError(null);
    }
  }, [open, condition, resetToDefault, setServerError]);

  const handleSubmit = onSubmit(async (values) => {
    if (condition?.code) {
      await updateCondition(condition.code, { percent: values.percent });
    } else {
      await createCondition(values);
    }
    onClose();
  });

  return (
    <EditorDialog
      open={open}
      title={condition ? "Edit Trade-in Condition" : "Create Trade-in Condition"}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <TextField
          label="Code"
          fullWidth
          {...register("code")}
          error={!!errors.code}
          helperText={errors.code?.message}
          InputProps={{
            readOnly: !!condition?.code,
          }}
        />
        <TextField
          label="Percent"
          type="number"
          fullWidth
          inputProps={{ min: 0, max: 1000, step: "0.01" }}
          {...register("percent")}
          error={!!errors.percent}
          helperText={errors.percent?.message}
        />
      </Stack>
    </EditorDialog>
  );
}
