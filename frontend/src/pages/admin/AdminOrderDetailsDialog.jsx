import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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
  FormHelperText,
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

const cancelReasonSchema = yup.object({
  reason: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .required("Reason is required")
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason must be at most 500 characters"),
});

const internalCommentSchema = yup.object({
  comment: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .test(
      "comment-min-if-present",
      "Comment must be at least 3 characters",
      (value) => !value || value.length >= 3
    )
    .max(1000, "Comment must be at most 1000 characters"),
});

const assignManagerSchema = yup.object({
  managerId: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" ? NaN : Number(originalValue)
    )
    .typeError("Manager is required")
    .integer("Manager is required")
    .positive("Manager is required")
    .required("Manager is required"),
});

const statusChangeSchema = yup.object({
  statusId: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" ? NaN : Number(originalValue)
    )
    .typeError("Status is required")
    .integer("Status is required")
    .positive("Status is required")
    .required("Status is required"),
  statusNote: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .test(
      "status-note-min-if-present",
      "Note must be at least 3 characters",
      (value) => !value || value.length >= 3
    )
    .max(500, "Note must be at most 500 characters"),
});

const deliveryUpdateSchema = yup.object({
  deliveryContact: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .test(
      "delivery-contact-min-if-present",
      "Contact name must be at least 2 characters",
      (value) => !value || value.length >= 2
    )
    .max(100, "Contact name must be at most 100 characters"),
  deliveryPhone: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .test(
      "delivery-phone-min-if-present",
      "Phone must be at least 7 characters",
      (value) => !value || value.length >= 7
    )
    .max(30, "Phone must be at most 30 characters"),
  deliveryAddress: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .test(
      "delivery-address-min-if-present",
      "Address must be at least 5 characters",
      (value) => !value || value.length >= 5
    )
    .max(200, "Address must be at most 200 characters"),
});

const assignCourierSchema = yup.object({
  courierId: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" ? NaN : Number(originalValue)
    )
    .typeError("Courier is required")
    .integer("Courier is required")
    .positive("Courier is required")
    .required("Courier is required"),
});

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
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const lastHistoryOrderId = useRef(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(cancelReasonSchema),
    defaultValues: { reason: "" },
  });
  const {
    register: registerComment,
    handleSubmit: handleCommentSubmit,
    reset: resetComment,
    formState: { errors: commentErrors },
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(internalCommentSchema),
    defaultValues: { comment: "" },
  });
  const {
    control: managerAssignControl,
    handleSubmit: handleManagerAssignSubmit,
    reset: resetManagerAssign,
    formState: { errors: managerAssignErrors },
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(assignManagerSchema),
    defaultValues: { managerId: "" },
  });
  const {
    control: statusControl,
    handleSubmit: handleStatusSubmit,
    reset: resetStatusForm,
    formState: { errors: statusErrors },
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(statusChangeSchema),
    defaultValues: { statusId: "", statusNote: "" },
  });
  const selectedStatusId = useWatch({
    control: statusControl,
    name: "statusId",
  });
  const {
    control: courierAssignControl,
    handleSubmit: handleCourierAssignSubmit,
    reset: resetCourierAssignForm,
    formState: { errors: courierAssignErrors },
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(assignCourierSchema),
    defaultValues: { courierId: "" },
  });
  const selectedCourierId = useWatch({
    control: courierAssignControl,
    name: "courierId",
  });
  const {
    control: deliveryControl,
    handleSubmit: handleDeliverySubmit,
    reset: resetDeliveryForm,
    formState: { errors: deliveryErrors },
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(deliveryUpdateSchema),
    defaultValues: {
      deliveryContact: "",
      deliveryAddress: "",
      deliveryPhone: "",
    },
  });

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
  const orderIdentity = order?.id ?? orderId ?? null;
  const initialDialogValues = useMemo(
    () => ({
      statusId: order?.statusId ?? "",
      managerId: assignedManager?.id ? String(assignedManager.id) : "",
      courierId: assignedCourier?.id ?? "",
      deliveryContact: delivery.contact_name ?? "",
      deliveryAddress: delivery.delivery_address ?? "",
      deliveryPhone: delivery.delivery_phone ?? "",
      comment: details?.comments?.comment_internal ?? "",
    }),
    [
      order?.statusId,
      assignedManager?.id,
      assignedCourier?.id,
      delivery.contact_name,
      delivery.delivery_address,
      delivery.delivery_phone,
      details?.comments?.comment_internal,
    ]
  );

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
      resetCourierAssignForm({ courierId: "" });
      resetDeliveryForm({
        deliveryContact: "",
        deliveryAddress: "",
        deliveryPhone: "",
      });
      resetStatusForm({ statusId: "", statusNote: "" });
      reset({ reason: "" });
      resetComment({ comment: "" });
      resetManagerAssign({ managerId: "" });
      setHistoryExpanded(false);
      setActionsExpanded(false);
      lastHistoryOrderId.current = null;
      return;
    }

    resetStatusForm({
      statusId: initialDialogValues.statusId,
      statusNote: "",
    });
    resetManagerAssign({ managerId: initialDialogValues.managerId });
    resetCourierAssignForm({
      courierId: initialDialogValues.courierId
        ? String(initialDialogValues.courierId)
        : "",
    });
    resetDeliveryForm({
      deliveryContact: initialDialogValues.deliveryContact,
      deliveryAddress: initialDialogValues.deliveryAddress,
      deliveryPhone: initialDialogValues.deliveryPhone,
    });
    resetComment({ comment: initialDialogValues.comment });
  }, [
    open,
    orderIdentity,
    initialDialogValues,
    resetCourierAssignForm,
    resetDeliveryForm,
    resetStatusForm,
    reset,
    resetComment,
    resetManagerAssign,
  ]);

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

  const handleStatusChange = async ({ statusId, statusNote }) => {
    if (!statusId || !onChangeStatus || actionLoading?.status) return;
    const trimmedStatusNote = (statusNote || "").trim();
    await onChangeStatus(Number(statusId), trimmedStatusNote || undefined);
    resetStatusForm({ statusId, statusNote: "" });
  };

  const handleAssignManager = async ({ managerId }) => {
    if (!onAssign || actionLoading?.assignManager) return;
    await onAssign(3, Number(managerId));
  };

  const handleAssignCourier = async ({ courierId }) => {
    if (!courierId || !onAssign || actionLoading?.assignCourier) return;
    await onAssign(4, Number(courierId));
    resetCourierAssignForm({ courierId: "" });
  };

  const handleUnassignManager = async () => {
    if (!onUnassign || actionLoading?.unassignManager) return;
    await onUnassign(3);
  };

  const handleUnassignCourier = async () => {
    if (!onUnassign || actionLoading?.unassignCourier) return;
    await onUnassign(4);
  };

  const handleSaveDelivery = async ({
    deliveryContact,
    deliveryAddress,
    deliveryPhone,
  }) => {
    if (!onUpdateDelivery || actionLoading?.delivery) return;
    const payload = {
      contact_name: (deliveryContact || "").trim(),
      delivery_address: (deliveryAddress || "").trim(),
      delivery_phone: (deliveryPhone || "").trim(),
    };
    await onUpdateDelivery({
      contact_name: payload.contact_name,
      delivery_address: payload.delivery_address,
      delivery_phone: payload.delivery_phone,
    });
    resetDeliveryForm({
      deliveryContact: payload.contact_name,
      deliveryAddress: payload.delivery_address,
      deliveryPhone: payload.delivery_phone,
    });
  };

  const handleSaveComment = async ({ comment }) => {
    if (!onUpdateComment || actionLoading?.comment) return;
    await onUpdateComment(comment.trim());
  };

  const handleCancelOrder = async ({ reason }) => {
    if (!onCancel || actionLoading?.cancel) return;
    await onCancel(reason.trim());
    reset({ reason: "" });
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
                {...registerComment("comment")}
                error={Boolean(commentErrors.comment)}
                helperText={commentErrors.comment?.message}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleCommentSubmit(handleSaveComment)}
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
                          <Controller
                            control={managerAssignControl}
                            name="managerId"
                            render={({ field }) => (
                              <Select
                                {...field}
                                labelId="admin-order-manager-select"
                                label="Manager"
                                disabled={actionLoading?.assignManager}
                                error={Boolean(managerAssignErrors.managerId)}
                              >
                                <MenuItem value="">Select manager</MenuItem>
                                {managers.map((manager) => (
                                  <MenuItem key={manager.id} value={String(manager.id)}>
                                    {manager.full_name} ({manager.email})
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                          <FormHelperText error={Boolean(managerAssignErrors.managerId)}>
                            {managerAssignErrors.managerId?.message || " "}
                          </FormHelperText>
                        </FormControl>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            onClick={handleManagerAssignSubmit(handleAssignManager)}
                            disabled={actionLoading?.assignManager}
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
                          <Controller
                            control={courierAssignControl}
                            name="courierId"
                            render={({ field }) => (
                              <Select
                                {...field}
                                labelId="admin-order-courier-select"
                                label="Courier"
                                disabled={actionLoading?.assignCourier}
                                error={Boolean(courierAssignErrors.courierId)}
                              >
                                <MenuItem value="">Select courier</MenuItem>
                                {couriers.map((courier) => (
                                  <MenuItem key={courier.id} value={String(courier.id)}>
                                    {courier.full_name} ({courier.email})
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                          <FormHelperText error={Boolean(courierAssignErrors.courierId)}>
                            {courierAssignErrors.courierId?.message || " "}
                          </FormHelperText>
                        </FormControl>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            onClick={handleCourierAssignSubmit(handleAssignCourier)}
                            disabled={!selectedCourierId || actionLoading?.assignCourier}
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
                        <Controller
                          control={statusControl}
                          name="statusId"
                          render={({ field }) => (
                            <Select
                              {...field}
                              labelId="admin-order-status-select"
                              label="Status"
                              disabled={actionLoading?.status}
                              error={Boolean(statusErrors.statusId)}
                            >
                              {statuses.map((status) => (
                                <MenuItem key={status.id} value={status.id}>
                                  {status.name}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {statusErrors.statusId && (
                          <FormHelperText error>
                            {statusErrors.statusId.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                      <Controller
                        control={statusControl}
                        name="statusNote"
                        render={({ field }) => (
                          <TextField
                            {...field}
                            size="small"
                            label="Note (optional)"
                            error={Boolean(statusErrors.statusNote)}
                            helperText={statusErrors.statusNote?.message}
                            fullWidth
                          />
                        )}
                      />
                      <Button
                        variant="contained"
                        onClick={handleStatusSubmit(handleStatusChange)}
                        disabled={!selectedStatusId || actionLoading?.status}
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
                      <Controller
                        control={deliveryControl}
                        name="deliveryContact"
                        render={({ field }) => (
                          <TextField
                            {...field}
                            size="small"
                            label="Contact name"
                            error={Boolean(deliveryErrors.deliveryContact)}
                            helperText={deliveryErrors.deliveryContact?.message}
                          />
                        )}
                      />
                      <Controller
                        control={deliveryControl}
                        name="deliveryPhone"
                        render={({ field }) => (
                          <TextField
                            {...field}
                            size="small"
                            label="Phone"
                            error={Boolean(deliveryErrors.deliveryPhone)}
                            helperText={deliveryErrors.deliveryPhone?.message}
                          />
                        )}
                      />
                    </Stack>
                    <Controller
                      control={deliveryControl}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          size="small"
                          label="Address"
                          error={Boolean(deliveryErrors.deliveryAddress)}
                          helperText={deliveryErrors.deliveryAddress?.message}
                          fullWidth
                        />
                      )}
                    />
                    <Button
                      variant="contained"
                      onClick={handleDeliverySubmit(handleSaveDelivery)}
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
                      {...register("reason")}
                      fullWidth
                      multiline
                      minRows={2}
                      error={Boolean(errors.reason)}
                      helperText={errors.reason?.message}
                    />
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleSubmit(handleCancelOrder)}
                      disabled={actionLoading?.cancel}
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
