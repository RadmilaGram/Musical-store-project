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

export default function CancelReasonDialog({
  open,
  onClose,
  onConfirm,
  loading,
  error,
  orderId,
}) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const trimmedReason = reason.trim();
  const canSubmit = trimmedReason.length > 0 && !loading;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    await onConfirm(trimmedReason);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {orderId ? `Cancel Order #${orderId}` : "Cancel Order"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography>Please provide a cancellation reason.</Typography>
          <TextField
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            multiline
            minRows={3}
            required
            placeholder="Reason for cancellation"
          />
          {error && <Alert severity="error">Failed to cancel order.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={!canSubmit}
        >
          Cancel order
        </Button>
      </DialogActions>
    </Dialog>
  );
}
