import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  Table,
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

export default function OrderDetailsDialog({
  open,
  onClose,
  onExited,
  loading,
  error,
  details,
  onCancelOrder,
  orderId,
  hideCancel = false,
  extraActions = null,
}) {
  const order = details?.order;
  const items = details?.items || [];
  const tradeInItems = details?.tradeInItems || [];
  const client = details?.client || null;
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [cancelError, setCancelError] = React.useState(null);
  const statusName = String(order?.status || "").toLowerCase();
  const canCancel = ["new", "preparing", "ready"].includes(statusName);
  const displayValue = (value) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string" && value.trim() === "") return "—";
    return value;
  };

  const handleCancel = async () => {
    if (!orderId || !onCancelOrder || cancelLoading) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      await onCancelOrder(orderId);
      setConfirmOpen(false);
    } catch (err) {
      setCancelError("Failed to cancel order.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        TransitionProps={{ onExited }}
      >
      <DialogTitle>
        {order?.id ? `Order #${order.id}` : "Order details"}
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {error && !loading && (
          <Alert severity="error">Failed to load order details.</Alert>
        )}

        {!loading && !error && order && (
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography>Status: {order.status}</Typography>
              <Typography>Items total: {order.itemsTotal}</Typography>
              <Typography>Total discount: {order.totalDiscount}</Typography>
              <Typography>Total: {order.total}</Typography>
            </Stack>

            {client && (client.full_name || client.email) && (
              <Stack spacing={1}>
                <Typography variant="h6">Client</Typography>
                {client.full_name && (
                  <Typography>Name: {displayValue(client.full_name)}</Typography>
                )}
                {client.email && (
                  <Typography>Email: {displayValue(client.email)}</Typography>
                )}
              </Stack>
            )}

            {(order.contact_name ||
              order.delivery_phone ||
              order.delivery_address) && (
              <Stack spacing={1}>
                <Typography variant="h6">Delivery</Typography>
                <Typography>
                  Contact: {displayValue(order.contact_name)}
                </Typography>
                <Typography>
                  Phone: {displayValue(order.delivery_phone)}
                </Typography>
                <Typography>
                  Address: {displayValue(order.delivery_address)}
                </Typography>
              </Stack>
            )}

            {(order.comment_client || order.comment_internal) && (
              <Stack spacing={1}>
                <Typography variant="h6">Comments</Typography>
                <Typography>
                  Client comment: {displayValue(order.comment_client)}
                </Typography>
                <Typography>
                  Internal comment: {displayValue(order.comment_internal)}
                </Typography>
              </Stack>
            )}

            <Stack spacing={1}>
              <Typography variant="h6">Items</Typography>
              {items.length === 0 ? (
                <Typography>No items</Typography>
              ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={`${item.productId}-${item.title}`}>
                          <TableCell>
                            {item.brandName
                              ? `${item.brandName} — ${item.title}`
                              : item.title}
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{item.price}</TableCell>
                          <TableCell align="right">{item.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="h6">Trade-in items</Typography>
              {tradeInItems.length === 0 ? (
                <Typography>No trade-in items</Typography>
              ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Percent</TableCell>
                        <TableCell align="right">Discount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tradeInItems.map((item) => (
                        <TableRow key={`${item.productId}-${item.title}`}>
                          <TableCell>
                            {item.brandName
                              ? `${item.brandName} — ${item.title}`
                              : item.title}
                          </TableCell>
                          <TableCell align="right">
                            {item.quantity ?? "-"}
                          </TableCell>
                          <TableCell align="right">{item.percent}</TableCell>
                          <TableCell align="right">
                            {item.discountAmount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {!hideCancel && canCancel && orderId && (
          <Button color="error" onClick={() => setConfirmOpen(true)}>
            Cancel order
          </Button>
        )}
        {extraActions}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Cancel order?</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography>This action cannot be undone.</Typography>
            {cancelError && <Alert severity="error">{cancelError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={cancelLoading}>
            Back
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancel}
            disabled={cancelLoading}
            startIcon={
              cancelLoading ? (
                <CircularProgress color="inherit" size={16} />
              ) : null
            }
          >
            Cancel order
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
