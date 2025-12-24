import React from "react";
import { IconButton, Tooltip, Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function RowActions({
  onEdit,
  onDelete,
  disableEdit = false,
  disableDelete = false,
}) {
  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="Edit">
        <span>
          <IconButton onClick={onEdit} disabled={disableEdit} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Delete">
        <span>
          <IconButton
            onClick={onDelete}
            disabled={disableDelete}
            color="error"
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
