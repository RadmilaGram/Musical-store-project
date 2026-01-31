import React from "react";
import { Box, Typography } from "@mui/material";
import PageTitle from "../ui/PageTitle";

export default function TradeInHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      <PageTitle>{title}</PageTitle>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
}
