import React, { useEffect } from "react";
import {
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  TableSortLabel,
  TablePagination,
} from "@mui/material";
import { cancelMyOrder } from "../../api/orders.api";
import { useMyOrders } from "../../use-cases/useMyOrders";
import OrderDetailsDialog from "./OrderDetailsDialog";
import PageContainer from "../../components/ui/PageContainer";
import PageTitle from "../../components/ui/PageTitle";

export default function OrdersPage() {
  const {
    items,
    page,
    loading,
    error,
    loadMyOrders,
    openOrderDetails,
    closeOrderDetails,
    selectedOrderId,
    details,
    detailsLoading,
    detailsError,
  } = useMyOrders();
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [openedOrderId, setOpenedOrderId] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [limit, setLimit] = React.useState(10);
  const [offset, setOffset] = React.useState(0);
  const [sortBy, setSortBy] = React.useState("created_at");
  const [sortDir, setSortDir] = React.useState("desc");

  const handleOpenDetails = (orderId) => {
    if (import.meta.env.DEV) {
      console.log("[my-orders] open details", orderId);
    }
    setOpenedOrderId(orderId);
    openOrderDetails(orderId);
    setDialogOpen(true);
  };

  const handleCancelOrder = async (orderId) => {
    await cancelMyOrder(orderId);
    setDialogOpen(false);
    await loadMyOrders(buildQueryParams());
  };

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

  const buildQueryParams = () => {
    const params = { limit, offset, sortBy, sortDir };
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
    if (dateFrom) {
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      params.dateTo = dateTo;
    }
    return params;
  };

  const handleSort = (key) => {
    const nextDir =
      sortBy === key ? (sortDir === "asc" ? "desc" : "asc") : "asc";
    setSortBy(key);
    setSortDir(nextDir);
    setOffset(0);
  };

  const handlePageChange = (_, nextPage) => {
    setOffset(nextPage * limit);
  };

  const handleRowsPerPageChange = (event) => {
    const nextLimit = Number(event.target.value);
    setLimit(nextLimit);
    setOffset(0);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  };

  useEffect(() => {
    loadMyOrders(buildQueryParams()).catch(() => {});
  }, [loadMyOrders, limit, offset, sortBy, sortDir, statusFilter, dateFrom, dateTo]);

  const pageIndex = limit > 0 ? Math.floor(offset / limit) : 0;

  return (
    <PageContainer maxWidth="lg">
      <PageTitle>My Orders</PageTitle>

      {loading && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      )}

      {error && !loading && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Alert severity="error">Failed to load orders.</Alert>
          <Button variant="contained" onClick={() => loadMyOrders(buildQueryParams())}>
            Retry
          </Button>
        </Stack>
      )}

      {!loading && !error && Number(page?.total ?? 0) === 0 && (
        <Typography>No orders yet</Typography>
      )}

      {!loading && !error && Number(page?.total ?? 0) > 0 && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="orders-status-label">Status</InputLabel>
                <Select
                  labelId="orders-status-label"
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setOffset(0);
                  }}
                >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="preparing">Preparing</MenuItem>
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="delivering">Delivering</MenuItem>
                <MenuItem value="finished">Finished</MenuItem>
                <MenuItem value="canceled">Canceled</MenuItem>
              </Select>
            </FormControl>
              <TextField
                size="small"
                label="From"
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setOffset(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                label="To"
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setOffset(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            <Button variant="outlined" onClick={clearFilters}>
              Clear
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Showing {items.length} of {page?.total ?? 0}
          </Typography>
        </Stack>
      )}

      {!loading && !error && Number(page?.total ?? 0) > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sortDirection={sortBy === "id" ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === "id"}
                    direction={sortBy === "id" ? sortDir : "asc"}
                    onClick={() => handleSort("id")}
                  >
                    Order #
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === "created_at" ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === "created_at"}
                    direction={sortBy === "created_at" ? sortDir : "asc"}
                    onClick={() => handleSort("created_at")}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === "status" ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === "status"}
                    direction={sortBy === "status" ? sortDir : "asc"}
                    onClick={() => handleSort("status")}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sortDirection={sortBy === "total_final" ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === "total_final"}
                    direction={sortBy === "total_final" ? sortDir : "asc"}
                    onClick={() => handleSort("total_final")}
                  >
                    Total
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell align="right">{order.total}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenDetails(order.id)}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!loading && !error && Number(page?.total ?? 0) > 0 && (
        <TablePagination
          component="div"
          count={Number(page?.total ?? 0)}
          page={pageIndex}
          onPageChange={handlePageChange}
          rowsPerPage={limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      )}
      <OrderDetailsDialog
        open={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onExited={() => {
          if (selectedOrderId) {
            closeOrderDetails();
          }
          setOpenedOrderId(null);
        }}
        loading={detailsLoading}
        error={detailsError}
        details={details}
        onCancelOrder={handleCancelOrder}
        orderId={openedOrderId}
      />
    </PageContainer>
  );
}
