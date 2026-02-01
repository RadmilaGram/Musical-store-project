import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function AdminOrderDetailsDialog({
  open,
  onClose,
  orderId,
  details,
  detailsLoading,
  detailsError,
  history,
  historyLoading,
  historyError,
  actionLoading,
  actionError,
  statuses,
  managers,
  couriers,
  onFetchHistory,
  onChangeStatus,
  onAssign,
  onUnassign,
  onCancel,
  onUpdateDelivery,
  onUpdateComment,
}) {
  const [statusId, setStatusId] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [managerId, setManagerId] = useState("");
  const [courierId, setCourierId] = useState("");
  const [deliveryContact, setDeliveryContact] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [commentInternal, setCommentInternal] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const lastHistoryOrderId = useRef(null);

  const order = details?.order || null;
  const client = details?.client || null;
  const assignments = details?.assignments || {};
  const items = details?.items || [];
  const tradeIn = details?.tradeIn || [];
  const totals = details?.totals || {};
  const timestamps = details?.timestamps || {};
  const delivery = details?.delivery || {};

  const statusName = order?.statusName || "";
  const assignedManager = assignments?.manager || null;
  const assignedCourier = assignments?.courier || null;

  const isLoadingAny =
    detailsLoading ||
    actionLoading?.status ||
    actionLoading?.assignManager ||
    actionLoading?.unassignManager ||
    actionLoading?.assignCourier ||
    actionLoading?.unassignCourier ||
    actionLoading?.cancel ||
    actionLoading?.delivery ||
    actionLoading?.comment;

  useEffect(() => {
    if (!open) {
      setStatusId("");
      setStatusNote("");
      setManagerId("");
      setCourierId("");
      setDeliveryContact("");
      setDeliveryAddress("");
      setDeliveryPhone("");
      setCommentInternal("");
      setCancelReason("");
      setHistoryExpanded(false);
      setActionsExpanded(false);
      lastHistoryOrderId.current = null;
      return;
    }

    if (order) {
      setStatusId(order.statusId ?? "");
    }
    setManagerId(assignedManager?.id ?? "");
    setCourierId(assignedCourier?.id ?? "");
    setDeliveryContact(delivery.contact_name ?? "");
    setDeliveryAddress(delivery.delivery_address ?? "");
    setDeliveryPhone(delivery.delivery_phone ?? "");
    setCommentInternal(details?.comments?.comment_internal ?? "");
  }, [open, order, assignedManager, assignedCourier, delivery, details]);

  useEffect(() => {
    if (!open || !orderId || !onFetchHistory) {
      return;
    }
    if (lastHistoryOrderId.current === orderId) {
      return;
    }
    lastHistoryOrderId.current = orderId;
    onFetchHistory();
  }, [open, orderId, onFetchHistory]);

  const formatUser = (user) => {
    if (!user) return "—";
    if (user.full_name && user.email) {
      return `${user.full_name} (${user.email})`;
    }
    return user.full_name || user.email || "—";
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const historyItems = useMemo(() => history || [], [history]);
  const noteItems = useMemo(
    () =>
      historyItems.filter(
        (row) => typeof row.note === "string" && row.note.trim() !== ""
      ),
    [historyItems]
  );

  const handleHistoryToggle = (_, expanded) => {
    setHistoryExpanded(expanded);
    if (expanded && onFetchHistory) {
      onFetchHistory();
    }
  };

  const handleActionsToggle = (_, expanded) => {
    setActionsExpanded(expanded);
  };

  const handleStatusChange = async () => {
    if (!statusId || !onChangeStatus || actionLoading?.status) return;
    await onChangeStatus(Number(statusId), statusNote || undefined);
    setStatusNote("");
  };

  const handleAssignManager = async () => {
    if (!managerId || !onAssign || actionLoading?.assignManager) return;
    await onAssign(3, Number(managerId));
  };

  const handleAssignCourier = async () => {
    if (!courierId || !onAssign || actionLoading?.assignCourier) return;
    await onAssign(4, Number(courierId));
  };

  const handleUnassignManager = async () => {
    if (!onUnassign || actionLoading?.unassignManager) return;
    await onUnassign(3);
  };

  const handleUnassignCourier = async () => {
    if (!onUnassign || actionLoading?.unassignCourier) return;
    await onUnassign(4);
  };

  const handleSaveDelivery = async () => {
    if (!onUpdateDelivery || actionLoading?.delivery) return;
    await onUpdateDelivery({
      contact_name: deliveryContact,
      delivery_address: deliveryAddress,
      delivery_phone: deliveryPhone,
    });
  };

  const handleSaveComment = async () => {
    if (!onUpdateComment || actionLoading?.comment) return;
    await onUpdateComment(commentInternal);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason || !onCancel || actionLoading?.cancel) return;
    await onCancel(cancelReason);
    setCancelReason("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {orderId ? `Order #${orderId}` : "Order details"}{" "}
        {statusName ? `— ${statusName}` : ""}
      </DialogTitle>
      <DialogContent dividers>
        {detailsLoading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {detailsError && !detailsLoading && (
          <Alert severity="error">Failed to load order details.</Alert>
        )}

        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {actionError}
          </Alert>
        )}

        {!detailsLoading && !detailsError && order && (
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h6">Summary</Typography>
              <Typography>Client: {formatUser(client)}</Typography>
              <Typography>Status: {statusName || "—"}</Typography>
              <Typography>
                Totals: items {totals.total_price_items ?? "—"} | discount{" "}
                {totals.total_discount ?? "—"} | final {totals.total_final ?? "—"}
              </Typography>
              <Typography>
                Created: {formatDate(timestamps.created_at)} | Updated:{" "}
                {formatDate(timestamps.updated_at)}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="h6">Notes</Typography>
              {noteItems.length === 0 ? (
                <Typography>No notes</Typography>
              ) : (
                noteItems.map((row) => {
                  const author = formatUser(row.changed_by);
                  const authorLabel = author === "—" ? "System" : author;
                  return (
                    <Paper variant="outlined" key={`note-${row.id}`}>
                      <Stack spacing={0.5} sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(row.changed_at)} • {authorLabel}
                        </Typography>
                        <Typography>{row.note}</Typography>
                      </Stack>
                    </Paper>
                  );
                })
              )}
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="h6">Internal comment</Typography>
              <TextField
                size="small"
                multiline
                minRows={2}
                value={commentInternal}
                onChange={(event) =>
                  setCommentInternal(event.target.value)
                }
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleSaveComment}
                disabled={actionLoading?.comment}
                startIcon={
                  actionLoading?.comment ? (
                    <CircularProgress size={16} />
                  ) : null
                }
              >
                Save comment
              </Button>
            </Stack>

            <Divider />

            <Accordion expanded={historyExpanded} onChange={handleHistoryToggle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>History</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {historyLoading && (
                  <Stack alignItems="center" sx={{ py: 2 }}>
                    <CircularProgress size={20} />
                  </Stack>
                )}
                {historyError && !historyLoading && (
                  <Alert severity="error">Failed to load history.</Alert>
                )}
                {!historyLoading && !historyError && historyItems.length === 0 && (
                  <Typography>No history entries</Typography>
                )}
                {!historyLoading && !historyError && historyItems.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Changed at</TableCell>
                          <TableCell>From</TableCell>
                          <TableCell>To</TableCell>
                          <TableCell>By</TableCell>
                          <TableCell>Note</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historyItems.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{formatDate(row.changed_at)}</TableCell>
                            <TableCell>{row.oldStatusName || "—"}</TableCell>
                            <TableCell>{row.newStatusName || "—"}</TableCell>
                            <TableCell>{formatUser(row.changed_by)}</TableCell>
                            <TableCell>{row.note || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>

            <Divider />

            <Accordion expanded={actionsExpanded} onChange={handleActionsToggle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Actions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <Stack spacing={2}>
                    <Typography variant="h6">Assignments</Typography>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <Stack spacing={1} sx={{ flex: 1 }}>
                        <Typography>
                          Manager: {formatUser(assignedManager)}
                        </Typography>
                        <FormControl size="small">
                          <InputLabel id="admin-order-manager-select">
                            Manager
                          </InputLabel>
                          <Select
                            labelId="admin-order-manager-select"
                            label="Manager"
                            value={managerId}
                            onChange={(event) => setManagerId(event.target.value)}
                            disabled={actionLoading?.assignManager}
                          >
                            <MenuItem value="">Select manager</MenuItem>
                            {managers.map((manager) => (
                              <MenuItem key={manager.id} value={manager.id}>
                                {manager.full_name} ({manager.email})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            onClick={handleAssignManager}
                            disabled={!managerId || actionLoading?.assignManager}
                            startIcon={
                              actionLoading?.assignManager ? (
                                <CircularProgress size={16} />
                              ) : null
                            }
                          >
                            Assign
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleUnassignManager}
                            disabled={
                              !assignedManager ||
                              actionLoading?.unassignManager
                            }
                            startIcon={
                              actionLoading?.unassignManager ? (
                                <CircularProgress size={16} />
                              ) : null
                            }
                          >
                            Unassign
                          </Button>
                        </Stack>
                      </Stack>

                      <Stack spacing={1} sx={{ flex: 1 }}>
                        <Typography>
                          Courier: {formatUser(assignedCourier)}
                        </Typography>
                        <FormControl size="small">
                          <InputLabel id="admin-order-courier-select">
                            Courier
                          </InputLabel>
                          <Select
                            labelId="admin-order-courier-select"
                            label="Courier"
                            value={courierId}
                            onChange={(event) => setCourierId(event.target.value)}
                            disabled={actionLoading?.assignCourier}
                          >
                            <MenuItem value="">Select courier</MenuItem>
                            {couriers.map((courier) => (
                              <MenuItem key={courier.id} value={courier.id}>
                                {courier.full_name} ({courier.email})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            onClick={handleAssignCourier}
                            disabled={!courierId || actionLoading?.assignCourier}
                            startIcon={
                              actionLoading?.assignCourier ? (
                                <CircularProgress size={16} />
                              ) : null
                            }
                          >
                            Assign
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleUnassignCourier}
                            disabled={
                              !assignedCourier ||
                              actionLoading?.unassignCourier
                            }
                            startIcon={
                              actionLoading?.unassignCourier ? (
                                <CircularProgress size={16} />
                              ) : null
                            }
                          >
                            Unassign
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={2}>
                    <Typography variant="h6">Status</Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel id="admin-order-status-select">
                          Status
                        </InputLabel>
                        <Select
                          labelId="admin-order-status-select"
                          label="Status"
                          value={statusId}
                          onChange={(event) => setStatusId(event.target.value)}
                          disabled={actionLoading?.status}
                        >
                          {statuses.map((status) => (
                            <MenuItem key={status.id} value={status.id}>
                              {status.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        label="Note (optional)"
                        value={statusNote}
                        onChange={(event) => setStatusNote(event.target.value)}
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        onClick={handleStatusChange}
                        disabled={!statusId || actionLoading?.status}
                        startIcon={
                          actionLoading?.status ? (
                            <CircularProgress size={16} />
                          ) : null
                        }
                      >
                        Change
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={2}>
                    <Typography variant="h6">Delivery</Typography>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        size="small"
                        label="Contact name"
                        value={deliveryContact}
                        onChange={(event) => setDeliveryContact(event.target.value)}
                      />
                      <TextField
                        size="small"
                        label="Phone"
                        value={deliveryPhone}
                        onChange={(event) => setDeliveryPhone(event.target.value)}
                      />
                    </Stack>
                    <TextField
                      size="small"
                      label="Address"
                      value={deliveryAddress}
                      onChange={(event) => setDeliveryAddress(event.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={handleSaveDelivery}
                      disabled={actionLoading?.delivery}
                      startIcon={
                        actionLoading?.delivery ? (
                          <CircularProgress size={16} />
                        ) : null
                      }
                    >
                      Save delivery
                    </Button>
                  </Stack>

                  <Divider />

                  <Stack spacing={2}>
                    <Typography variant="h6">Cancel order</Typography>
                    <TextField
                      size="small"
                      label="Reason"
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      fullWidth
                      multiline
                      minRows={2}
                    />
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleCancelOrder}
                      disabled={!cancelReason || actionLoading?.cancel}
                      startIcon={
                        actionLoading?.cancel ? (
                          <CircularProgress size={16} />
                        ) : null
                      }
                    >
                      Cancel order
                    </Button>
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="h6">Items</Typography>
              {items.length === 0 ? (
                <Typography>No items</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id || item.product_id}>
                          <TableCell>{item.product?.name ?? "—"}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{item.price_each}</TableCell>
                          <TableCell align="right">{item.subtotal}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>

            <Stack spacing={2}>
              <Typography variant="h6">Trade-in</Typography>
              {tradeIn.length === 0 ? (
                <Typography>No trade-in items</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Base amount</TableCell>
                        <TableCell align="right">Percent</TableCell>
                        <TableCell align="right">Discount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tradeIn.map((item) => (
                        <TableRow key={item.id || item.product_id}>
                          <TableCell>{item.product?.name ?? "—"}</TableCell>
                          <TableCell align="right">{item.base_amount}</TableCell>
                          <TableCell align="right">{item.percent}</TableCell>
                          <TableCell align="right">{item.discount_amount}</TableCell>
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
        <Button onClick={onClose} disabled={isLoadingAny}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
