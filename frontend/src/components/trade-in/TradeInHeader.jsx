import React from "react";
import { Box, Typography } from "@mui/material";

export default function TradeInHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4">{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
}
