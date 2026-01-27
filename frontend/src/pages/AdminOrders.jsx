import React, { useEffect } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useAdminOrdersList } from "../use-cases/useAdminOrdersList";

export default function AdminOrders() {
  const {
    filters,
    setFilters,
    data,
    loading,
    error,
    refetch,
    applyFilters,
    resetFilters,
  } = useAdminOrdersList();

  useEffect(() => {
    refetch().catch(() => {});
  }, [refetch]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatUser = (user) => {
    if (!user) return "-";
    if (user.full_name && user.email) {
      return `${user.full_name} (${user.email})`;
    }
    return user.full_name || user.email || "-";
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Admin Orders
      </Typography>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            size="small"
            label="Status ID"
            type="number"
            value={filters.statusId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, statusId: event.target.value }))
            }
          />
          <TextField
            size="small"
            label="Client ID"
            type="number"
            value={filters.clientId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, clientId: event.target.value }))
            }
          />
          <TextField
            size="small"
            label="Manager ID"
            type="number"
            value={filters.managerId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, managerId: event.target.value }))
            }
          />
          <TextField
            size="small"
            label="Courier ID"
            type="number"
            value={filters.courierId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, courierId: event.target.value }))
            }
          />
          <TextField
            size="small"
            label="From"
            type="date"
            value={filters.dateFrom}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))
            }
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={filters.dateTo}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, dateTo: event.target.value }))
            }
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={() => applyFilters()}>
            Apply
          </Button>
          <Button variant="outlined" onClick={() => resetFilters()}>
            Reset
          </Button>
        </Stack>
      </Stack>

      {loading && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      )}

      {error && !loading && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Alert severity="error">Failed to load orders.</Alert>
          <Button variant="contained" onClick={() => refetch()}>
            Retry
          </Button>
        </Stack>
      )}

      {!loading && !error && data.length === 0 && (
        <Typography>No orders found</Typography>
      )}

      {!loading && !error && data.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Courier</TableCell>
                <TableCell align="right">Total Final</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{order.statusName}</TableCell>
                  <TableCell>{formatUser(order.client)}</TableCell>
                  <TableCell>{formatUser(order.manager)}</TableCell>
                  <TableCell>{formatUser(order.courier)}</TableCell>
                  <TableCell align="right">{order.total_final}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
