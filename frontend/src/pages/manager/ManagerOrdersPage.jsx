import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  FormControl,
  FormControlLabel,
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
  TablePagination,
  TableSortLabel,
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
    queuePage,
    myPage,
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
    loadQueue,
    loadMy,
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
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [hideClosed, setHideClosed] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [openedOrderId, setOpenedOrderId] = useState(null);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [historyOrderId, setHistoryOrderId] = useState(null);
  const [isCancelOpen, setCancelOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [isMarkReadyOpen, setMarkReadyOpen] = useState(false);
  const [markReadyOrderId, setMarkReadyOrderId] = useState(null);
  const [markReadyNote, setMarkReadyNote] = useState("");

  const buildOptions = (overrides = {}) => ({
    sortBy: overrides.sortBy ?? sortBy,
    sortDir: overrides.sortDir ?? sortDir,
    hideClosed: overrides.hideClosed ?? hideClosed,
    limit: overrides.limit ?? rowsPerPage,
    offset: overrides.offset ?? page * rowsPerPage,
  });

  useEffect(() => {
    refreshAll(buildOptions()).catch(() => {});
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
    loadHistory(orderId).catch(() => {});
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
      await cancelOrder(cancelOrderId, reason, buildOptions());
      setCancelOpen(false);
      setCancelOrderId(null);
      setDialogOpen(false);
      setOpenedOrderId(null);
    } catch (err) {
      // errors are shown in the dialog via cancelError
    }
  };

  const handleTake = async (orderId) => {
    await takeOrder(orderId, buildOptions());
  };

  const handleMarkReady = async (orderId) => {
    setMarkReadyOrderId(orderId);
    setMarkReadyNote("");
    setMarkReadyOpen(true);
  };

  const handleConfirmMarkReady = async () => {
    if (!markReadyOrderId) {
      return;
    }
    const trimmedNote = markReadyNote.trim();
    const payload = trimmedNote ? { note: trimmedNote } : {};
    await markReady(markReadyOrderId, payload, buildOptions());
    setMarkReadyOpen(false);
    setMarkReadyOrderId(null);
    setMarkReadyNote("");
  };

  const handleSort = (key) => {
    const nextDir =
      sortBy === key ? (sortDir === "asc" ? "desc" : "asc") : "asc";
    setSortBy(key);
    setSortDir(nextDir);
    setPage(0);
    refreshAll(
      buildOptions({ sortBy: key, sortDir: nextDir, offset: 0 })
    ).catch(() => {});
  };

  const handleHideClosedChange = (event) => {
    const nextValue = Boolean(event.target.checked);
    setHideClosed(nextValue);
    setPage(0);
    refreshAll(buildOptions({ hideClosed: nextValue, offset: 0 })).catch(() => {});
  };

  const handleTabChange = (_, next) => {
    setTab(next);
    setPage(0);
    const options = buildOptions({ offset: 0 });
    if (next === 0) {
      loadQueue(options).catch(() => {});
    } else {
      loadMy(options).catch(() => {});
    }
  };

  const handlePageChange = (_, nextPage) => {
    setPage(nextPage);
    const options = buildOptions({ offset: nextPage * rowsPerPage });
    if (tab === 0) {
      loadQueue(options).catch(() => {});
    } else {
      loadMy(options).catch(() => {});
    }
  };

  const handleRowsPerPageChange = (event) => {
    const nextRows = Number(event.target.value);
    setRowsPerPage(nextRows);
    setPage(0);
    const options = buildOptions({ limit: nextRows, offset: 0 });
    if (tab === 0) {
      loadQueue(options).catch(() => {});
    } else {
      loadMy(options).catch(() => {});
    }
  };

  const renderSortableHeader = (label, key, props = {}) => (
    <TableCell
      {...props}
      sx={{
        whiteSpace: "nowrap",
        ...(props.sx || {}),
      }}
    >
      <TableSortLabel
        active={sortBy === key}
        direction={sortBy === key ? sortDir : "asc"}
        onClick={() => handleSort(key)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

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

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
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
          <Button
            variant="contained"
            onClick={() => refreshAll(buildOptions())}
          >
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
                {renderSortableHeader("Order #", "order_id")}
                {renderSortableHeader("Created", "created_at")}
                {renderSortableHeader("Status", "status")}
                {renderSortableHeader("Total", "total_final", { align: "right" })}
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
      {!loading && !error && tab === 0 && queue.length > 0 && (
        <TablePagination
          component="div"
          count={Number(queuePage?.total ?? queue.length)}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      )}

      {!loading && !error && tab === 1 && my.length === 0 && (
        <Typography>No assigned orders yet</Typography>
      )}

      {!loading && !error && tab === 1 && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hideClosed}
                onChange={handleHideClosedChange}
              />
            }
            label="Hide finished/cancelled"
          />
          {my.length > 0 && (
            <>
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
            </>
          )}
        </Stack>
      )}

      {!loading && !error && tab === 1 && my.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {renderSortableHeader("Order #", "order_id")}
                {renderSortableHeader("Created", "created_at")}
                {renderSortableHeader("Status", "status")}
                {renderSortableHeader("Total", "total_final", { align: "right" })}
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
      {!loading && !error && tab === 1 && my.length > 0 && (
        <TablePagination
          component="div"
          count={Number(myPage?.total ?? my.length)}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
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
        historyNotes={history}
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
      <Dialog
        open={isMarkReadyOpen}
        onClose={() => {
          setMarkReadyOpen(false);
          setMarkReadyOrderId(null);
          setMarkReadyNote("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mark order ready</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Note (optional)"
            value={markReadyNote}
            onChange={(event) => setMarkReadyNote(event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setMarkReadyOpen(false);
              setMarkReadyOrderId(null);
              setMarkReadyNote("");
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirmMarkReady}>
            Mark Ready
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
