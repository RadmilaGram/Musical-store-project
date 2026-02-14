import React from "react";
import { Dialog, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function ImagePreviewDialog({ open, src, alt, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg">
      <Box
        sx={{
          position: "relative",
          p: 2,
          maxWidth: "90vw",
          maxHeight: "85vh",
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label="Close preview"
          sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            width: "100%",
            height: "100%",
            maxWidth: "90vw",
            maxHeight: "85vh",
            objectFit: "contain",
            display: "block",
          }}
        />
      </Box>
    </Dialog>
  );
}
