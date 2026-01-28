import React from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
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
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useAdminOrdersList } from "../use-cases/useAdminOrdersList";
import { useAdminOrderDetails } from "../use-cases/useAdminOrderDetails";
import AdminOrderDetailsDialog from "./admin/AdminOrderDetailsDialog";

export default function AdminOrders() {
  const {
    filters,
    setFilters,
    data,
    page,
    sortBy,
    sortDir,
    q,
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
    resetFilters,
    onPageChange,
    onRowsPerPageChange,
    onSortChange,
    onSearchChange,
  } = useAdminOrdersList();
  const orderDetails = useAdminOrderDetails({ onAfterAction: refetch });
  const pageNumber = page.limit ? Math.floor(page.offset / page.limit) : 0;

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
            label="Search client"
            value={q}
            onChange={(event) => onSearchChange(event.target.value)}
          />
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
                <TableCell sortDirection={sortBy === "id" ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === "id"}
                    direction={sortBy === "id" ? sortDir : "asc"}
                    onClick={() => onSortChange("id")}
                  >
                    Order #
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={sortBy === "created_at" ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === "created_at"}
                    direction={sortBy === "created_at" ? sortDir : "asc"}
                    onClick={() => onSortChange("created_at")}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={sortBy === "statusId" ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === "statusId"}
                    direction={sortBy === "statusId" ? sortDir : "asc"}
                    onClick={() => onSortChange("statusId")}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={sortBy === "client_name" ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === "client_name"}
                    direction={sortBy === "client_name" ? sortDir : "asc"}
                    onClick={() => onSortChange("client_name")}
                  >
                    Client
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={sortBy === "manager_name" ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === "manager_name"}
                    direction={sortBy === "manager_name" ? sortDir : "asc"}
                    onClick={() => onSortChange("manager_name")}
                  >
                    Manager
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={sortBy === "courier_name" ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === "courier_name"}
                    direction={sortBy === "courier_name" ? sortDir : "asc"}
                    onClick={() => onSortChange("courier_name")}
                  >
                    Courier
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="right"
                  sortDirection={sortBy === "total_final" ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === "total_final"}
                    direction={sortBy === "total_final" ? sortDir : "asc"}
                    onClick={() => onSortChange("total_final")}
                  >
                    Total Final
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((order) => (
                <TableRow
                  key={order.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => orderDetails.open(order.id)}
                >
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{order.statusName}</TableCell>
                  <TableCell>{formatUser(order.client)}</TableCell>
                  <TableCell>{formatUser(order.manager)}</TableCell>
                  <TableCell>{formatUser(order.courier)}</TableCell>
                  <TableCell align="right">{order.total_final}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          orderDetails.open(order.id);
                        }}
                      >
                        <VisibilityIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!loading && !error && data.length > 0 && (
        <TablePagination
          component="div"
          count={page.total}
          page={pageNumber}
          onPageChange={(_, nextPage) => onPageChange(nextPage * page.limit)}
          rowsPerPage={page.limit}
          onRowsPerPageChange={(event) =>
            onRowsPerPageChange(Number(event.target.value))
          }
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      )}

      <AdminOrderDetailsDialog
        open={orderDetails.isOpen}
        onClose={orderDetails.close}
        orderId={orderDetails.orderId}
        details={orderDetails.details}
        detailsLoading={orderDetails.detailsLoading}
        detailsError={orderDetails.detailsError}
        history={orderDetails.history}
        historyLoading={orderDetails.historyLoading}
        historyError={orderDetails.historyError}
        actionLoading={orderDetails.actionLoading}
        actionError={orderDetails.actionError}
        statuses={statuses}
        managers={managers}
        couriers={couriers}
        onFetchHistory={orderDetails.fetchHistory}
        onChangeStatus={orderDetails.doChangeStatus}
        onAssign={orderDetails.doAssign}
        onUnassign={orderDetails.doUnassign}
        onCancel={orderDetails.doCancel}
        onUpdateDelivery={orderDetails.doUpdateDelivery}
        onUpdateComment={orderDetails.doUpdateComment}
      />
    </Container>
  );
}
