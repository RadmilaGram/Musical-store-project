import React, { useEffect } from "react";
import {
  Container,
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
} from "@mui/material";
import { cancelMyOrder } from "../../api/orders.api";
import { useMyOrders } from "../../use-cases/useMyOrders";
import OrderDetailsDialog from "./OrderDetailsDialog";

export default function OrdersPage() {
  const {
    items,
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
    await loadMyOrders();
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

  const filteredOrders = React.useMemo(() => {
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return (items || []).filter((order) => {
      const statusValue = String(order.status || "").toLowerCase();
      if (statusFilter !== "all" && statusValue !== statusFilter) {
        return false;
      }

      if (fromDate || toDate) {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        if (Number.isNaN(orderDate.getTime())) return false;
        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
      }

      return true;
    });
  }, [items, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  useEffect(() => {
    loadMyOrders().catch(() => {});
  }, [loadMyOrders]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        My Orders
      </Typography>

      {loading && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      )}

      {error && !loading && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Alert severity="error">Failed to load orders.</Alert>
          <Button variant="contained" onClick={() => loadMyOrders()}>
            Retry
          </Button>
        </Stack>
      )}

      {!loading && !error && items.length === 0 && (
        <Typography>No orders yet</Typography>
      )}

      {!loading && !error && items.length > 0 && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="orders-status-label">Status</InputLabel>
              <Select
                labelId="orders-status-label"
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
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
              onChange={(event) => setDateFrom(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label="To"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="outlined" onClick={clearFilters}>
              Clear
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredOrders.length} of {items.length}
          </Typography>
        </Stack>
      )}

      {!loading && !error && items.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
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
    </Container>
  );
}
