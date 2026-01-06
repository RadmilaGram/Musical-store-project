import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Box, Snackbar } from "@mui/material";
import EntityToolbar from "../../../../admin/crud/EntityToolbar";
import CrudTable from "../../../../admin/crud/CrudTable";
import RowActions from "../../../../admin/crud/RowActions";
import ConfirmDialog from "../../../../admin/crud/ConfirmDialog";
import { useTradeInConditionsCrud } from "../../../../features/admin/tradeInConditions/useTradeInConditionsCrud";
import TradeInConditionEditorDialog from "./TradeInConditionEditorDialog";

const getErrorMessage = (error, fallback = "Failed to delete condition") =>
  error?.response?.data?.message || error?.message || fallback;

export default function TradeInConditionsSection() {
  const {
    items,
    status,
    error,
    ensureLoaded,
    reload,
    updateCondition,
    deleteCondition,
  } = useTradeInConditionsCrud();
  const [searchValue, setSearchValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [conditionToDelete, setConditionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [inlineError, setInlineError] = useState(null);

  useEffect(() => {
    ensureLoaded().catch(() => {});
  }, [ensureLoaded]);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleCreateClick = useCallback(() => {
    setEditingCondition(null);
    setEditorOpen(true);
  }, []);

  const handleEditRequest = useCallback((condition) => {
    setEditingCondition(condition);
    setEditorOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((condition) => {
    setConditionToDelete(condition);
    setDeleteError(null);
    setConfirmOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingCondition(null);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setConditionToDelete(null);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!conditionToDelete?.code) return;
    setIsDeleting(true);
    try {
      await deleteCondition(conditionToDelete.code);
      closeConfirm();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setIsDeleting(false);
    }
  }, [conditionToDelete, deleteCondition, closeConfirm]);

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    if (!query) return items;
    return (items || []).filter(
      (item) =>
        item.code?.toLowerCase().includes(query) ||
        String(item.percent ?? "").toLowerCase().includes(query)
    );
  }, [items, searchValue]);

  const columns = useMemo(
    () => [
      { field: "code", headerName: "Code", flex: 1, minWidth: 140 },
      {
        field: "percent",
        headerName: "Percent",
        width: 140,
        editable: true,
        renderCell: (params) => {
          const { row } = params;
          const value = row?.percent;
          if (value === null || typeof value === "undefined") {
            return "—";
          }
          const num = Number(value);
          return Number.isFinite(num) ? `${num}%` : `${String(value)}%`;
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <RowActions
            onEdit={() => handleEditRequest(params.row)}
            onDelete={() => handleDeleteRequest(params.row)}
            disableEdit
            hideEdit
          />
        ),
      },
    ],
    [handleEditRequest, handleDeleteRequest]
  );

  const processRowUpdate = useCallback(
    async (newRow, oldRow) => {
      const raw = newRow?.percent;
      const nextValue =
        raw === "" || raw === null || typeof raw === "undefined"
          ? null
          : Number(raw);

      if (nextValue === null || Number.isNaN(nextValue)) {
        throw new Error("Percent must be a valid number");
      }
      if (nextValue < 0 || nextValue > 1000) {
        throw new Error("Percent must be between 0 and 1000");
      }
      if (Number(oldRow.percent) === nextValue) {
        return oldRow;
      }

      try {
        await updateCondition(oldRow.code, { percent: nextValue });
        setInlineError(null);
        return { ...oldRow, percent: nextValue };
      } catch (err) {
        const message = getErrorMessage(err, "Failed to update percent");
        setInlineError(message);
        throw err;
      }
    },
    [updateCondition]
  );

  const handleRowUpdateError = useCallback((err) => {
    setInlineError(getErrorMessage(err, "Failed to update percent"));
  }, []);

  const isLoading = status === "loading";

  return (
    <Box sx={{ mb: 4, maxWidth: 900, mx: "auto" }}>
      <EntityToolbar
        title="Trade-in Conditions"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={handleCreateClick}
        onRefreshClick={() => reload()}
        isRefreshing={isLoading}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <CrudTable
        rows={filteredRows}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.code}
        disableColumnMenu
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleRowUpdateError}
      />

      <TradeInConditionEditorDialog
        open={editorOpen}
        condition={editingCondition}
        onClose={closeEditor}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete trade-in condition"
        description={
          conditionToDelete
            ? `Are you sure you want to delete "${conditionToDelete.code}"?`
            : "Are you sure you want to delete this trade-in condition?"
        }
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onClose={closeConfirm}
        loading={isDeleting}
      />
      <Snackbar
        open={Boolean(deleteError)}
        autoHideDuration={5000}
        onClose={() => setDeleteError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setDeleteError(null)}
          sx={{ width: "100%" }}
        >
          {deleteError}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(inlineError)}
        autoHideDuration={5000}
        onClose={() => setInlineError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setInlineError(null)}
          sx={{ width: "100%" }}
        >
          {inlineError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
