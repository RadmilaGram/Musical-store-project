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
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useManagerOrders } from "../../use-cases/useManagerOrders";
import { useAuth } from "../../hooks/useAuth";
import CancelReasonDialog from "./CancelReasonDialog";
import HistoryDialog from "./HistoryDialog";
import OrderDetailsDialog from "../client/OrderDetailsDialog";

export default function ManagerOrdersPage() {
  const { user } = useAuth();
  const role = Number(user?.role);
  const isAdmin = role === 1;
  const isManager = role === 3;
  const {
    queue,
    my,
    loading,
    error,
    details,
    detailsLoading,
    detailsError,
    history,
    historyLoading,
    historyError,
    cancelLoading,
    cancelError,
    refreshAll,
    takeOrder,
    markReady,
    loadDetails,
    loadHistory,
    cancelOrder,
  } = useManagerOrders();
  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [openedOrderId, setOpenedOrderId] = useState(null);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [historyOrderId, setHistoryOrderId] = useState(null);
  const [isCancelOpen, setCancelOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);

  useEffect(() => {
    refreshAll().catch(() => {});
  }, [refreshAll]);

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

  const filteredMyOrders = useMemo(() => {
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return (my || []).filter((order) => {
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
  }, [my, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleOpenDetails = (orderId) => {
    setOpenedOrderId(orderId);
    loadDetails(orderId).catch(() => {});
    setDialogOpen(true);
  };

  const handleOpenHistory = (orderId) => {
    setHistoryOrderId(orderId);
    loadHistory(orderId).catch(() => {});
    setHistoryOpen(true);
  };

  const handleOpenCancel = (orderId) => {
    if (!orderId) {
      return;
    }
    setCancelOrderId(orderId);
    setCancelOpen(true);
  };

  const handleConfirmCancel = async (reason) => {
    try {
      await cancelOrder(cancelOrderId, reason);
      setCancelOpen(false);
      setCancelOrderId(null);
      setDialogOpen(false);
      setOpenedOrderId(null);
    } catch (err) {
      // errors are shown in the dialog via cancelError
    }
  };

  const handleTake = async (orderId) => {
    await takeOrder(orderId);
  };

  const handleMarkReady = async (orderId) => {
    await markReady(orderId);
  };

  const statusValue = String(details?.order?.status || "").toLowerCase();
  const canManagerCancel =
    isAdmin ||
    (isManager && ["new", "preparing", "ready"].includes(statusValue));
  const canShowCancel =
    Boolean(openedOrderId) && !detailsLoading && !detailsError && details?.order;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Manager Orders
      </Typography>

      <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
        <Tab label={`Queue (${queue.length})`} />
        <Tab label={`My Orders (${my.length})`} />
      </Tabs>

      {loading && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      )}

      {error && !loading && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Alert severity="error">Failed to load orders.</Alert>
          <Button variant="contained" onClick={() => refreshAll()}>
            Retry
          </Button>
        </Stack>
      )}

      {!loading && !error && tab === 0 && queue.length === 0 && (
        <Typography>No orders in queue</Typography>
      )}

      {!loading && !error && tab === 0 && queue.length > 0 && (
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
              {queue.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell align="right">{order.total}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenDetails(order.id)}
                      >
                        Details
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenHistory(order.id)}
                        >
                          History
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleTake(order.id)}
                      >
                        Take
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && !error && tab === 1 && my.length === 0 && (
        <Typography>No assigned orders yet</Typography>
      )}

      {!loading && !error && tab === 1 && my.length > 0 && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="manager-orders-status-label">Status</InputLabel>
              <Select
                labelId="manager-orders-status-label"
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
            Showing {filteredMyOrders.length} of {my.length}
          </Typography>
        </Stack>
      )}

      {!loading && !error && tab === 1 && my.length > 0 && (
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
              {filteredMyOrders.map((order) => {
                const statusValue = String(order.status || "").toLowerCase();
                return (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell align="right">{order.total}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenDetails(order.id)}
                        >
                          Details
                        </Button>
                        {(isAdmin || isManager) && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenHistory(order.id)}
                          >
                            History
                          </Button>
                        )}
                        {statusValue === "preparing" && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleMarkReady(order.id)}
                          >
                            Mark Ready
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <OrderDetailsDialog
        open={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onExited={() => {
          setOpenedOrderId(null);
        }}
        loading={detailsLoading}
        error={detailsError}
        details={details}
        onCancelOrder={null}
        orderId={openedOrderId}
        hideCancel
        extraActions={
          canShowCancel && canManagerCancel ? (
            <Button
              color="error"
              onClick={() => handleOpenCancel(openedOrderId)}
            >
              Cancel order
            </Button>
          ) : null
        }
      />
      <CancelReasonDialog
        open={isCancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setCancelOrderId(null);
        }}
        onConfirm={handleConfirmCancel}
        loading={cancelLoading}
        error={cancelError}
        orderId={cancelOrderId}
      />
      <HistoryDialog
        open={isHistoryOpen}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryOrderId(null);
        }}
        loading={historyLoading}
        error={historyError}
        history={history}
        orderId={historyOrderId}
      />
    </Container>
  );
}
