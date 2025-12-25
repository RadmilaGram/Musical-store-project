import React from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Button,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";

export default function EntityToolbar({
  title,
  searchValue,
  onSearchChange,
  onCreateClick,
  onRefreshClick,
  isRefreshing = false,
  disableCreate = false,
  filtersSlot = null,
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack spacing={1}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
        >
          <Typography variant="h5" component="h2">
            {title}
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateClick}
              disabled={disableCreate}
            >
              Create
            </Button>
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={onRefreshClick} disabled={isRefreshing}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <TextField
          fullWidth
          placeholder="Search…"
          value={searchValue}
          onChange={onSearchChange}
          size="small"
        />

        {filtersSlot && (
          <Box sx={{ mt: 1 }}>
            {filtersSlot}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
