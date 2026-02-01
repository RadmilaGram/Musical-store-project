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
  Paper,
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
import { useCourierOrders } from "../../use-cases/useCourierOrders";
import HistoryDialog from "../manager/HistoryDialog";
import OrderDetailsDialog from "../client/OrderDetailsDialog";

export default function CourierOrdersPage() {
  const {
    queueOrders,
    myOrders,
    loading,
    error,
    details,
    detailsLoading,
    detailsError,
    history,
    historyLoading,
    historyError,
    refreshAll,
    takeOrder,
    finishOrder,
    loadQueue,
    loadMy,
    loadDetails,
    loadHistory,
  } = useCourierOrders();
  const [tab, setTab] = useState(0);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [openedOrderId, setOpenedOrderId] = useState(null);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [historyOrderId, setHistoryOrderId] = useState(null);
  const [isFinishOpen, setFinishOpen] = useState(false);
  const [finishOrderId, setFinishOrderId] = useState(null);
  const [finishNote, setFinishNote] = useState("");

  useEffect(() => {
    loadMy().catch(() => {});
  }, [loadMy]);

  useEffect(() => {
    if (tab === 0) {
      loadQueue().catch(() => {});
    } else {
      loadMy().catch(() => {});
    }
  }, [tab, loadQueue, loadMy]);

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

  const queueItems = useMemo(() => queueOrders || [], [queueOrders]);
  const myItems = useMemo(() => myOrders || [], [myOrders]);

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

  const handleOpenFinish = (orderId) => {
    if (!orderId) {
      return;
    }
    setFinishOrderId(orderId);
    setFinishNote("");
    setFinishOpen(true);
  };

  const handleConfirmFinish = async () => {
    if (!finishOrderId) {
      return;
    }
    const trimmedNote = finishNote.trim();
    const payload = trimmedNote ? { note: trimmedNote } : {};
    await finishOrder(finishOrderId, payload);
    setFinishOpen(false);
    setFinishOrderId(null);
    setFinishNote("");
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Courier Orders
      </Typography>

      <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
        <Tab label={`Queue (${queueItems.length})`} />
        <Tab label={`My Orders (${myItems.length})`} />
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

      {!loading && !error && tab === 0 && queueItems.length === 0 && (
        <Typography>No orders in queue</Typography>
      )}

      {!loading && !error && tab === 0 && queueItems.length > 0 && (
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
              {queueItems.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell align="right">{order.total}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => takeOrder(order.id)}
                      disabled={loading}
                    >
                      Take
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && !error && tab === 1 && myItems.length === 0 && (
        <Typography>No assigned orders yet</Typography>
      )}

      {!loading && !error && tab === 1 && myItems.length > 0 && (
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
              {myItems.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell align="right">{order.total}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenHistory(order.id)}
                      disabled={loading}
                    >
                      History
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDetails(order.id)}
                      disabled={loading}
                    >
                      Details
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenFinish(order.id)}
                      disabled={loading}
                      sx={{ ml: 1 }}
                    >
                      Finish
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
          setOpenedOrderId(null);
        }}
        loading={detailsLoading}
        error={detailsError}
        details={details}
        historyNotes={history}
        onCancelOrder={null}
        orderId={openedOrderId}
        hideCancel
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
        open={isFinishOpen}
        onClose={() => {
          setFinishOpen(false);
          setFinishOrderId(null);
          setFinishNote("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Finish delivery</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Note (optional)"
            value={finishNote}
            onChange={(event) => setFinishNote(event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFinishOpen(false);
              setFinishOrderId(null);
              setFinishNote("");
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirmFinish}>
            Finish
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
