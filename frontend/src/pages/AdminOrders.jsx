import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
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
    statuses,
    statusesLoading,
    statusesError,
    managers,
    managersLoading,
    managersError,
    couriers,
    couriersLoading,
    couriersError,
    counters,
    refetch,
    applyFilters,
    resetFilters,
  } = useAdminOrdersList();
  const [orderBy, setOrderBy] = useState("created_at");
  const [order, setOrder] = useState("desc");

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

  const getSortValue = (row, key) => {
    switch (key) {
      case "id":
        return Number(row.id ?? 0);
      case "created_at":
        return Date.parse(row.created_at || "") || 0;
      case "statusName":
        return row.statusName || "";
      case "client":
        return row.client?.full_name || "";
      case "manager":
        return row.manager?.full_name || "";
      case "courier":
        return row.courier?.full_name || "";
      case "total_final":
        return Number(row.total_final ?? 0);
      default:
        return "";
    }
  };

  const compareValues = (aValue, bValue) => {
    if (typeof aValue === "string" || typeof bValue === "string") {
      return String(aValue).localeCompare(String(bValue));
    }
    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  };

  const sortedData = useMemo(() => {
    const stabilized = data.map((row, index) => ({ row, index }));
    const direction = order === "asc" ? 1 : -1;

    stabilized.sort((a, b) => {
      const aValue = getSortValue(a.row, orderBy);
      const bValue = getSortValue(b.row, orderBy);
      const comparison = compareValues(aValue, bValue);
      if (comparison !== 0) {
        return comparison * direction;
      }
      return a.index - b.index;
    });

    return stabilized.map((item) => item.row);
  }, [data, order, orderBy]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Admin Orders
      </Typography>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="admin-orders-status-label">Status</InputLabel>
            <Select
              labelId="admin-orders-status-label"
              label="Status"
              value={filters.statusId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, statusId: event.target.value }))
              }
              disabled={statusesLoading}
            >
              <MenuItem value="">All statuses</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name} ({counters.byStatus?.[status.id] ?? 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Client ID"
            type="number"
            value={filters.clientId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, clientId: event.target.value }))
            }
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="admin-orders-manager-label">Manager</InputLabel>
            <Select
              labelId="admin-orders-manager-label"
              label="Manager"
              value={filters.managerId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, managerId: event.target.value }))
              }
              disabled={managersLoading}
            >
              <MenuItem value="">All managers</MenuItem>
              {managers.map((manager) => (
                <MenuItem key={manager.id} value={manager.id}>
                  {manager.full_name} ({manager.email}) (
                  {counters.byManager?.[manager.id] ?? 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="admin-orders-courier-label">Courier</InputLabel>
            <Select
              labelId="admin-orders-courier-label"
              label="Courier"
              value={filters.courierId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, courierId: event.target.value }))
              }
              disabled={couriersLoading}
            >
              <MenuItem value="">All couriers</MenuItem>
              {couriers.map((courier) => (
                <MenuItem key={courier.id} value={courier.id}>
                  {courier.full_name} ({courier.email}) (
                  {counters.byCourier?.[courier.id] ?? 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

      {statusesError && !statusesLoading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Failed to load statuses.
        </Alert>
      )}
      {(managersError || couriersError) && !managersLoading && !couriersLoading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Failed to load managers/couriers.
        </Alert>
      )}

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
                <TableCell sortDirection={orderBy === "id" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "id"}
                    direction={orderBy === "id" ? order : "asc"}
                    onClick={() => handleRequestSort("id")}
                  >
                    Order #
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={orderBy === "created_at" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "created_at"}
                    direction={orderBy === "created_at" ? order : "asc"}
                    onClick={() => handleRequestSort("created_at")}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={orderBy === "statusName" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "statusName"}
                    direction={orderBy === "statusName" ? order : "asc"}
                    onClick={() => handleRequestSort("statusName")}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === "client" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "client"}
                    direction={orderBy === "client" ? order : "asc"}
                    onClick={() => handleRequestSort("client")}
                  >
                    Client
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === "manager" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "manager"}
                    direction={orderBy === "manager" ? order : "asc"}
                    onClick={() => handleRequestSort("manager")}
                  >
                    Manager
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === "courier" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "courier"}
                    direction={orderBy === "courier" ? order : "asc"}
                    onClick={() => handleRequestSort("courier")}
                  >
                    Courier
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="right"
                  sortDirection={orderBy === "total_final" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "total_final"}
                    direction={orderBy === "total_final" ? order : "asc"}
                    onClick={() => handleRequestSort("total_final")}
                  >
                    Total Final
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((order) => (
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
