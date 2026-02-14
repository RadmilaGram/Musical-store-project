import React from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const cancelReasonSchema = yup.object({
  reason: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .required("Reason is required")
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export default function CancelReasonDialog({
  open,
  onClose,
  onConfirm,
  loading,
  error,
  orderId,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(cancelReasonSchema),
    defaultValues: { reason: "" },
  });

  React.useEffect(() => {
    if (!open) {
      reset({ reason: "" });
    }
  }, [open, reset]);

  const handleClose = () => {
    reset({ reason: "" });
    onClose();
  };

  const handleConfirm = async ({ reason }) => {
    await onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {orderId ? `Cancel Order #${orderId}` : "Cancel Order"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography>Please provide a cancellation reason.</Typography>
          <TextField
            label="Reason"
            {...register("reason")}
            multiline
            minRows={3}
            required
            placeholder="Reason for cancellation"
            error={Boolean(errors.reason)}
            helperText={errors.reason?.message}
          />
          {error && <Alert severity="error">Failed to cancel order.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit(handleConfirm)}
          disabled={loading}
        >
          Cancel order
        </Button>
      </DialogActions>
    </Dialog>
  );
}
