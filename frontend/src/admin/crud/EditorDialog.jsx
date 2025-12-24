import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
} from "@mui/material";

export default function EditorDialog({
  open,
  title,
  children,
  onClose,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isSubmitting = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent dividers>
        <Box component="form">{children}</Box>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <Button onClick={onClose} fullWidth disabled={isSubmitting}>
            {cancelText}
          </Button>
          <Button
            variant="contained"
            onClick={onSubmit}
            fullWidth
            disabled={isSubmitting}
          >
            {submitText}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
