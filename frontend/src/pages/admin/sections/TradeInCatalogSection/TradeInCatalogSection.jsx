import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Box, Snackbar, Switch, Typography } from "@mui/material";
import EntityToolbar from "../../../../admin/crud/EntityToolbar";
import CrudTable from "../../../../admin/crud/CrudTable";
import RowActions from "../../../../admin/crud/RowActions";
import ConfirmDialog from "../../../../admin/crud/ConfirmDialog";
import { useTradeInCatalogCrud } from "../../../../features/admin/tradeInCatalog/useTradeInCatalogCrud";
import { useProductsCrud } from "../../../../features/admin/products/useProductsCrud";
import TradeInCatalogCreateDrawer from "./create/TradeInCatalogCreateDrawer";

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

const formatMoney = (value) => {
  if (value === null || typeof value === "undefined") {
    return "—";
  }
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `$${num.toFixed(2)}`;
};

const parseMoneyInput = (value, { allowNull = false } = {}) => {
  if (allowNull && (value === "" || value === null || typeof value === "undefined")) {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return undefined;
  }
  return Number(num.toFixed(2));
};

export default function TradeInCatalogSection() {
  const {
    items,
    status,
    error,
    ensureLoaded,
    reload,
    updateEntry,
    deleteEntry,
    toggleActive,
  } = useTradeInCatalogCrud();
  const {
    items: productItems,
    ensureLoaded: ensureProductsLoaded,
  } = useProductsCrud();

  const [searchValue, setSearchValue] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [inlineError, setInlineError] = useState(null);
  const [activeConfirmOpen, setActiveConfirmOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    ensureLoaded().catch(() => {});
  }, [ensureLoaded]);

  useEffect(() => {
    ensureProductsLoaded().catch(() => {});
  }, [ensureProductsLoaded]);

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleRefresh = useCallback(() => {
    reload();
  }, [reload]);

  const handleCreateClick = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setCreateOpen(false);
  }, []);

  const handleDeleteRequest = useCallback((row) => {
    setEntryToDelete(row);
    setDeleteError(null);
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setEntryToDelete(null);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  const closeActiveConfirm = useCallback(() => {
    setActiveConfirmOpen(false);
    setPendingToggle(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!entryToDelete?.id) return;
    setIsDeleting(true);
    try {
      await deleteEntry(entryToDelete.id);
      closeConfirm();
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete catalog entry"));
      setIsDeleting(false);
    }
  }, [entryToDelete, deleteEntry, closeConfirm]);

  const executeToggle = useCallback(
    async (row, nextActive) => {
      if (!row?.id) return;
      setTogglingId(row.id);
      try {
        await toggleActive(row.id, nextActive);
        setInlineError(null);
      } catch (err) {
        setInlineError(getErrorMessage(err, "Failed to update offer"));
      } finally {
        setTogglingId(null);
        closeActiveConfirm();
      }
    },
    [toggleActive, closeActiveConfirm]
  );

  const handleActiveToggle = useCallback(
    (row, checked) => {
      const nextActive = checked ? 1 : 0;
      if (nextActive === 1) {
        setPendingToggle({ row, nextActive });
        setActiveConfirmOpen(true);
        return;
      }
      executeToggle(row, nextActive);
    },
    [executeToggle]
  );

  const handleConfirmActive = useCallback(() => {
    if (!pendingToggle?.row) return;
    executeToggle(pendingToggle.row, pendingToggle.nextActive);
  }, [pendingToggle, executeToggle]);

  const filteredRows = useMemo(() => {
    const query = (searchValue || "").trim().toLowerCase();
    if (!query) return items || [];
    return (items || []).filter((item) => {
      const haystack = [
        item.productName,
        item.brandName,
        item.typeName,
        item.referencePrice,
        item.baseDiscountAmount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, searchValue]);

  const isLoading = status === "loading";

  const columns = useMemo(
    () => [
      {
        field: "productName",
        headerName: "Product",
        flex: 1.4,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography variant="body2" fontWeight={600}>
              {row.productName || `#${row.productId}`}
            </Typography>
            {(row.brandName || row.typeName) && (
              <Typography variant="caption" color="text.secondary">
                {[row.brandName, row.typeName].filter(Boolean).join(" • ")}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: "referencePrice",
        headerName: "Reference price",
        width: 160,
        editable: true,
        valueFormatter: ({ value }) => formatMoney(value),
        renderCell: ({ row }) => formatMoney(row.referencePrice),
      },
      {
        field: "baseDiscountAmount",
        headerName: "Base discount",
        width: 160,
        editable: true,
        valueFormatter: ({ value }) => formatMoney(value),
        renderCell: ({ row }) => formatMoney(row.baseDiscountAmount),
      },
      {
        field: "isActive",
        headerName: "Active",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => {
          const isActive = Number(row?.isActive) === 1;
          const isBusy = isLoading || togglingId === row?.id;
          return (
            <Switch
              checked={isActive}
              size="small"
              onChange={(event) =>
                handleActiveToggle(row, event.target.checked)
              }
              disabled={isBusy}
            />
          );
        },
      },
      {
        field: "updatedAt",
        headerName: "Updated",
        width: 190,
        renderCell: ({ row }) => {
          const value = row?.updatedAt;
          if (!value) {
            return "—";
          }
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
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
            onEdit={() => {}}
            disableEdit
            onDelete={() => handleDeleteRequest(params.row)}
            hideEdit
          />
        ),
      },
    ],
    [handleDeleteRequest, handleActiveToggle, isLoading, togglingId]
  );

  const processRowUpdate = useCallback(
    async (newRow, oldRow) => {
      const referencePrice = parseMoneyInput(newRow?.referencePrice);
      if (typeof referencePrice === "undefined") {
        throw new Error("Reference price must be a non-negative number");
      }
      const baseDiscountAmount = parseMoneyInput(newRow?.baseDiscountAmount, {
        allowNull: true,
      });
      if (typeof baseDiscountAmount === "undefined") {
        throw new Error("Base discount must be a non-negative number");
      }

      const sameReference =
        Number(referencePrice) === Number(oldRow.referencePrice || 0);
      const sameDiscount =
        (baseDiscountAmount ?? null) === (oldRow.baseDiscountAmount ?? null);
      if (sameReference && sameDiscount) {
        return oldRow;
      }

      try {
        await updateEntry(oldRow.productId, {
          referencePrice,
          baseDiscountAmount,
        });
        setInlineError(null);
        return {
          ...oldRow,
          referencePrice,
          baseDiscountAmount,
        };
      } catch (err) {
        const message = getErrorMessage(err, "Failed to update entry");
        setInlineError(message);
        throw err;
      }
    },
    [updateEntry]
  );

  const handleRowUpdateError = useCallback((err) => {
    setInlineError(getErrorMessage(err, "Failed to update entry"));
  }, []);

  return (
    <Box sx={{ width: "100%" }}>
      <EntityToolbar
        title="Trade-in Catalog"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onCreateClick={handleCreateClick}
        onRefreshClick={handleRefresh}
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
        getRowId={(row) => row.id ?? row.productId}
        disableColumnMenu
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleRowUpdateError}
        isCellEditable={(params) => Number(params.row?.isActive) === 1}
      />

      <TradeInCatalogCreateDrawer
        open={createOpen}
        onClose={closeCreateDialog}
        products={productItems}
        offers={items}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete trade-in catalog entry"
        description={
          entryToDelete
            ? `Remove "${entryToDelete.productName}" from catalog?`
            : "Remove this product from catalog?"
        }
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onClose={closeConfirm}
        loading={isDeleting}
      />

      <ConfirmDialog
        open={activeConfirmOpen}
        title="Activate offer?"
        description="Only one active offer per product. Other offers will be deactivated."
        confirmText="Activate"
        onConfirm={handleConfirmActive}
        onClose={closeActiveConfirm}
        loading={Boolean(togglingId)}
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
