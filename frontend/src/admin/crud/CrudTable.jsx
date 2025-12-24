import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";

export default function CrudTable({ rows, columns, loading }) {
  return (
    <Box sx={{ width: "100%", height: 520 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        autoHeight={false}
      />
    </Box>
  );
}
