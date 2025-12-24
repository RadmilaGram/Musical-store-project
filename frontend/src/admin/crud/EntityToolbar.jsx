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
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        spacing={2}
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Typography variant="h5" component="h2">
          {title}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems="center"
          sx={{ flexGrow: 1 }}
        >
          <TextField
            fullWidth
            placeholder="Search…"
            value={searchValue}
            onChange={onSearchChange}
            size="small"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateClick}
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
    </Box>
  );
}
