import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Controller } from "react-hook-form";
import EditorDrawer from "../../../../admin/crud/EditorDrawer";
import { useSpecialFieldForm } from "../../../../forms/specialField/useSpecialFieldForm";
import { useSpecialFieldsCrud } from "../../../../features/admin/specialFields/useSpecialFieldsCrud";
import useSpecialFieldValues from "../../../../features/admin/specialFieldValues/useSpecialFieldValues";
import RowActions from "../../../../admin/crud/RowActions";
import ConfirmDialog from "../../../../admin/crud/ConfirmDialog";
import SpecialFieldValueEditorDialog from "./SpecialFieldValueEditorDialog";

const VALUE_DATATYPES = new Set([
  "select",
  "enum",
  "list",
  "string",
  "text",
]);

const getErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export default function SpecialFieldEditorDrawer({
  open,
  field,
  datatypes,
  onClose,
}) {
  const { createSpecialField, updateSpecialField } = useSpecialFieldsCrud();
  const {
    form,
    onSubmit,
    serverError,
    setServerError,
    isSubmitting,
    resetToDefault,
  } = useSpecialFieldForm();
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const [activeTab, setActiveTab] = useState("general");
  const [valueEditorOpen, setValueEditorOpen] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const watchedDatatypeId = watch("datatypeId");

  useEffect(() => {
    if (open) {
      resetToDefault(field);
      setActiveTab("general");
    } else {
      setServerError(null);
      setValueEditorOpen(false);
      setConfirmOpen(false);
      setPendingDelete(null);
      setDeleteError(null);
    }
  }, [open, field, resetToDefault, setServerError]);

  const selectedDatatype = useMemo(
    () =>
      datatypes.find(
        (dt) => String(dt.id) === String(watchedDatatypeId || field?.datatypeId)
      ) || null,
    [datatypes, watchedDatatypeId, field]
  );

  const supportsValues = Boolean(
    selectedDatatype &&
      VALUE_DATATYPES.has((selectedDatatype.name || "").toLowerCase())
  );
  const canManageValues = Boolean(supportsValues && field?.id);

  useEffect(() => {
    if (!canManageValues && activeTab === "values") {
      setActiveTab("general");
    }
  }, [canManageValues, activeTab]);

  const {
    items: valueItems,
    loading: valuesLoading,
    error: valuesError,
    reload: reloadValues,
    createValue,
    updateValue,
    deleteValue,
  } = useSpecialFieldValues(canManageValues ? field.id : null);

  const handleSubmit = onSubmit(async (values) => {
    if (field?.id) {
      await updateSpecialField(field.id, values);
    } else {
      await createSpecialField(values);
    }
    onClose();
  });

  const handleAddValue = () => {
    setEditingValue(null);
    setValueEditorOpen(true);
  };

  const handleEditValue = (value) => {
    setEditingValue(value);
    setValueEditorOpen(true);
  };

  const handleSubmitValue = async (newValue) => {
    if (editingValue) {
      await updateValue(editingValue, newValue);
    } else {
      await createValue(newValue);
    }
  };

  const handleDeleteValue = (value) => {
    setPendingDelete(value);
    setDeleteError(null);
    setConfirmOpen(true);
  };

  const confirmDeleteValue = async () => {
    if (!pendingDelete) return;
    try {
      await deleteValue(pendingDelete);
      setConfirmOpen(false);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete value"));
    }
  };

  const valueRows = useMemo(
    () => (valueItems || []).map((entry) => ({ id: entry.value, value: entry.value })),
    [valueItems]
  );

  const valueColumns = useMemo(
    () => [
      { field: "value", headerName: "Value", flex: 1 },
      {
        field: "actions",
        headerName: "Actions",
        width: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <RowActions
            onEdit={() => handleEditValue(params.row.value)}
            onDelete={() => handleDeleteValue(params.row.value)}
          />
        ),
      },
    ],
    []
  );

  const renderValuesTab = () => {
    if (!supportsValues) {
      return (
        <Alert severity="info">
          Values are not used for this datatype.
        </Alert>
      );
    }

    if (!field?.id) {
      return (
        <Alert severity="info">
          Save the field before managing values.
        </Alert>
      );
    }

    return (
      <>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button variant="contained" onClick={handleAddValue}>
            Add Value
          </Button>
          <Button
            variant="outlined"
            onClick={reloadValues}
            disabled={valuesLoading}
          >
            Refresh
          </Button>
        </Stack>

        {valuesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {valuesError}
          </Alert>
        )}

        <Box sx={{ maxHeight: 360, overflow: "auto" }}>
          <DataGrid
            rows={valueRows}
            columns={valueColumns}
            loading={valuesLoading}
            autoHeight
            disableRowSelectionOnClick
          />
        </Box>

        <SpecialFieldValueEditorDialog
          open={valueEditorOpen}
          value={editingValue}
          onClose={() => setValueEditorOpen(false)}
          onSubmit={handleSubmitValue}
        />

        <ConfirmDialog
          open={confirmOpen}
          title="Delete value"
          description={
            pendingDelete
              ? `Delete "${pendingDelete}"?`
              : "Are you sure you want to delete this value?"
          }
          confirmText="Delete"
          onConfirm={confirmDeleteValue}
          onClose={() => {
            setConfirmOpen(false);
            setPendingDelete(null);
          }}
          loading={false}
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
      </>
    );
  };

  return (
    <EditorDrawer
      open={open}
      title={field ? "Edit Special Field" : "Create Special Field"}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      width={520}
    >
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="General" value="general" />
        <Tab label="Values" value="values" disabled={!supportsValues} />
      </Tabs>

      {activeTab === "general" && (
        <Stack spacing={2}>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          <TextField
            label="Name"
            fullWidth
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
            autoFocus
          />
          <Controller
            name="datatypeId"
            control={control}
            render={({ field: ctrlField }) => (
              <TextField
                {...ctrlField}
                select
                label="Datatype"
                fullWidth
                error={!!errors.datatypeId}
                helperText={errors.datatypeId?.message}
              >
                <MenuItem value="">
                  <Typography color="text.secondary">
                    Select datatype
                  </Typography>
                </MenuItem>
                {datatypes.map((dt) => (
                  <MenuItem key={dt.id} value={dt.id}>
                    {dt.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>
      )}

      {activeTab === "values" && renderValuesTab()}
    </EditorDrawer>
  );
}
