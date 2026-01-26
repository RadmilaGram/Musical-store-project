import React from "react";
import {
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export default function HistoryDialog({
  open,
  onClose,
  loading,
  error,
  history,
  orderId,
}) {
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

  const rows = history || [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {orderId ? `Order #${orderId} History` : "Order History"}
      </DialogTitle>
      <DialogContent dividers sx={{ overflowX: "hidden" }}>
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {error && !loading && (
          <Alert severity="error">Failed to load history.</Alert>
        )}

        {!loading && !error && rows.length === 0 && (
          <Typography>No history yet.</Typography>
        )}

        {!loading && !error && rows.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: "100%" }}>
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: "nowrap", width: 140 }}>
                    Changed
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", width: 180 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", width: 180 }}>
                    Changed By
                  </TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((entry, idx) => (
                  <TableRow key={`${entry.changedAt || "row"}-${idx}`}>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(entry.changedAt)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {entry.oldStatus || "-"} -> {entry.newStatus || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {entry.changedBy || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                      {entry.note || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
