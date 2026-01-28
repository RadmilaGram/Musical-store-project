import React, { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import CrudTable from "../../admin/crud/CrudTable";
import { useAdminUsers } from "../../hooks/admin/useAdminUsers";

export default function AdminUsersPage() {
  const {
    users,
    loading,
    error,
    roleOptions,
    roleDrafts,
    activeDrafts,
    currentUserId,
    savingId,
    saveError,
    loadUsers,
    setRoleDraft,
    setActiveDraft,
    saveChanges,
  } = useAdminUsers();

  const staffRoleIds = useMemo(
    () => new Set(roleOptions.map((role) => role.id)),
    [roleOptions]
  );

  const staffRows = useMemo(
    () => users.filter((user) => staffRoleIds.has(Number(user.role))),
    [users, staffRoleIds]
  );

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80 },
      { field: "full_name", headerName: "Name", flex: 1, minWidth: 160 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      { field: "phone", headerName: "Phone", flex: 1, minWidth: 140 },
      {
        field: "role",
        headerName: "Role",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const userId = params.row?.id;
          const isSelf = Number(userId) === Number(currentUserId);
          const value = roleDrafts[userId] ?? params.row?.role ?? "";
          return (
            <FormControl
              size="small"
              fullWidth
              variant="outlined"
              sx={{ minWidth: 0 }}
            >
              <InputLabel id={`role-label-${userId}`}>Role</InputLabel>
              <Select
                labelId={`role-label-${userId}`}
                label="Role"
                value={value}
                onChange={(event) =>
                  setRoleDraft(userId, Number(event.target.value))
                }
                disabled={isSelf || savingId === userId}
                MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        },
      },
      {
        field: "is_active",
        headerName: "Active",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const userId = params.row?.id;
          const isSelf = Number(userId) === Number(currentUserId);
          const checked =
            activeDrafts[userId] ?? Boolean(params.row?.is_active);
          return (
            <Switch
              size="small"
              checked={checked}
              onChange={(event) =>
                setActiveDraft(userId, event.target.checked)
              }
              disabled={isSelf || savingId === userId}
            />
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const userId = params.row?.id;
          const isSelf = Number(userId) === Number(currentUserId);
          const value = roleDrafts[userId] ?? params.row?.role;
          const activeDraft =
            activeDrafts[userId] ?? Boolean(params.row?.is_active);
          const isSame = Number(value) === Number(params.row?.role);
          const isActiveSame =
            Boolean(activeDraft) === Boolean(params.row?.is_active);
          const hasChanges = !isSame || !isActiveSame;
          return (
            <Button
              size="small"
              variant="outlined"
              onClick={() => saveChanges(userId)}
              disabled={isSelf || savingId === userId || !hasChanges}
            >
              Save
            </Button>
          );
        },
      },
    ],
    [
      activeDrafts,
      currentUserId,
      roleDrafts,
      roleOptions,
      savingId,
      saveChanges,
      setActiveDraft,
      setRoleDraft,
    ]
  );

  return (
    <Container sx={{ py: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">Admin Users</Typography>
        <Button
          variant="outlined"
          onClick={() => loadUsers()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load users.
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to update role.
        </Alert>
      )}

      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <CrudTable
          rows={staffRows}
          columns={columns}
          loading={loading}
          rowHeight={52}
          getRowClassName={(params) =>
            params.row?.is_active ? "" : "admin-users-row--inactive"
          }
          sx={{
            "& .MuiDataGrid-cell": {
              alignItems: "center",
              display: "flex",
            },
            "& .MuiDataGrid-row.admin-users-row--inactive": {
              opacity: 0.6,
            },
          }}
        />
      </Box>
    </Container>
  );
}
