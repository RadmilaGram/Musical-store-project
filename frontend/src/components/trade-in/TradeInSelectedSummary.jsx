import React from "react";
import { Box, Typography } from "@mui/material";

export default function TradeInSelectedSummary({ totalDiscount }) {
  return (
    <Box
      sx={{
        mt: 1.5,
        p: 2,
        bgcolor: "#f5f5f5",
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography fontWeight={600}>Estimated total discount</Typography>
        <Typography variant="caption" color="text.secondary">
          Final discount is confirmed during order processing.
        </Typography>
      </Box>
      <Typography variant="h6">${totalDiscount}</Typography>
    </Box>
  );
}
