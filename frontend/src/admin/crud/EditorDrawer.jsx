import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function EditorDrawer({
  open,
  title,
  children,
  onClose,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isSubmitting = false,
  width = 420,
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width } }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 2, flexGrow: 1, overflowY: "auto" }}>{children}</Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1}>
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
      </Box>
    </Drawer>
  );
}
