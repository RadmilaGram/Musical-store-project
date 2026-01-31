import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";

export default function CrudTable({
  rows,
  columns,
  loading,
  autoHeight = false,
  containerSx,
  ...rest
}) {
  return (
    <Box
      sx={{
        width: "100%",
        height: autoHeight ? "auto" : 520,
        ...containerSx,
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        autoHeight={autoHeight}
        {...rest}
      />
    </Box>
  );
}
