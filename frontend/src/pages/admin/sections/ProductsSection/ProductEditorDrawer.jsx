import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import EditorDrawer from "../../../../admin/crud/EditorDrawer";
import productTypeSpecialFieldsApi from "../../../../api/productTypeSpecialFieldsApi";

const defaultValues = {
  name: "",
  description: "",
  img: "",
  price: "",
  brandId: "",
  statusId: "",
  typeId: "",
  specialFields: {},
};

const numberSelect = (label) =>
  yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === "" || originalValue === null || originalValue === undefined) {
        return NaN;
      }
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? NaN : parsed;
    })
    .typeError(label)
    .required(label);

const productSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  description: yup.string().nullable(),
  img: yup.string().nullable(),
  price: yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === "" || originalValue === null || originalValue === undefined) {
        return NaN;
      }
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? NaN : parsed;
    })
    .typeError("Price must be a number")
    .min(0, "Price must be ≥ 0")
    .required("Price is required"),
  brandId: numberSelect("Brand is required"),
  statusId: numberSelect("Status is required"),
  typeId: numberSelect("Product type is required"),
  specialFields: yup.object(),
});

const getErrorMessage = (error, fallback = "Failed to save product") =>
  error?.response?.data?.message || error?.message || fallback;

const isNumericKey = (key) => /^\d+$/.test(key);

const normalizeFieldValueForForm = (value, datatypeName) => {
  const type = (datatypeName || "").toLowerCase();
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value === "true" || value === "1";
    }
    return Boolean(value);
  }
  if (value === null || typeof value === "undefined") {
    return "";
  }
  return String(value);
};

const castValueForSubmit = (value, datatypeName) => {
  const type = (datatypeName || "").toLowerCase();
  if (type === "boolean") {
    return Boolean(value);
  }
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }
  if (type === "integer") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (type === "decimal") {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (type === "string") {
    return String(value);
  }
  return value;
};

const convertSpecialFields = (raw, catalogById, catalogByName) => {
  if (!raw) {
    return {};
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to parse special fields JSON", err);
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  const entries = Object.entries(parsed);
  if (!entries.length) {
    return {};
  }
  const numericFormat = entries.every(([key]) => isNumericKey(key));
  const result = {};
  if (numericFormat) {
    entries.forEach(([key, value]) => {
      const meta = catalogById[key] || {};
      result[key] = normalizeFieldValueForForm(value, meta.datatypeName);
    });
    return result;
  }
  entries.forEach(([name, value]) => {
    const field = catalogByName[name];
    if (!field) {
      console.warn(`Unknown special field "${name}", skipping`);
      return;
    }
    const key = String(field.id);
    result[key] = normalizeFieldValueForForm(value, field.datatypeName);
  });
  return result;
};

export default function ProductEditorDrawer({
  open,
  product,
  onClose,
  brands = [],
  productTypes = [],
  productStatuses = [],
  specialFieldsCatalog = [],
  onCreate,
  onUpdate,
}) {
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedFields, setAssignedFields] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState(null);

  const catalogById = useMemo(() => {
    const map = {};
    (specialFieldsCatalog || []).forEach((field) => {
      if (field?.id) {
        map[String(field.id)] = field;
      }
    });
    return map;
  }, [specialFieldsCatalog]);

  const catalogByName = useMemo(() => {
    const map = {};
    (specialFieldsCatalog || []).forEach((field) => {
      if (field?.name) {
        map[field.name] = field;
      }
    });
    return map;
  }, [specialFieldsCatalog]);

  const form = useForm({
    defaultValues,
    resolver: yupResolver(productSchema),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const typeIdValue = watch("typeId");
  const specialFieldsValues = watch("specialFields");

  const assignedFieldsMap = useMemo(() => {
    const map = {};
    (assignedFields || []).forEach((field) => {
      map[String(field.id)] = field;
    });
    return map;
  }, [assignedFields]);

  const resetForm = useCallback(
    (currentProduct) => {
      if (currentProduct) {
        const parsedSpecialFields = convertSpecialFields(
          currentProduct.specialFieldsRaw,
          catalogById,
          catalogByName
        );
        reset({
          name: currentProduct.name || "",
          description: currentProduct.description || "",
          img: currentProduct.img || "",
          price:
            typeof currentProduct.price === "number"
              ? currentProduct.price.toString()
              : currentProduct.price || "",
          brandId: currentProduct.brandId || "",
          statusId: currentProduct.statusId || "",
          typeId: currentProduct.typeId || "",
          specialFields: parsedSpecialFields,
        });
      } else {
        reset(defaultValues);
      }
      setServerError(null);
    },
    [reset, catalogById, catalogByName]
  );

  const handleClose = useCallback(() => {
    onClose();
    reset(defaultValues);
    setAssignedFields([]);
    setAssignedError(null);
  }, [onClose, reset]);

  useEffect(() => {
    if (open) {
      resetForm(product);
    } else {
      reset(defaultValues);
      setAssignedFields([]);
      setAssignedError(null);
    }
  }, [open, product, resetForm, reset]);

  const loadAssignedFields = useCallback(
    async (typeId) => {
      if (!typeId) {
        setAssignedFields([]);
        setAssignedError(null);
        return;
      }
      setAssignedLoading(true);
      setAssignedError(null);
      try {
        const data = await productTypeSpecialFieldsApi.listByType(typeId);
        setAssignedFields(data);
      } catch (error) {
        setAssignedFields([]);
        setAssignedError(getErrorMessage(error, "Failed to load special fields"));
      } finally {
        setAssignedLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    if (!typeIdValue) {
      setAssignedFields([]);
      setAssignedError(null);
      return;
    }
    loadAssignedFields(typeIdValue);
  }, [typeIdValue, loadAssignedFields, open]);

  useEffect(() => {
    if (!open) return;
    const allowedIds = new Set((assignedFields || []).map((field) => String(field.id)));
    const currentValues = getValues("specialFields") || {};
    const filteredValues = {};
    let changed = false;
    Object.entries(currentValues).forEach(([fieldId, value]) => {
      if (allowedIds.has(fieldId)) {
        filteredValues[fieldId] = value;
      } else {
        changed = true;
      }
    });
    if (changed) {
      setValue("specialFields", filteredValues, { shouldDirty: true });
    }
  }, [assignedFields, getValues, setValue, open]);

  const handleSpecialFieldChange = useCallback(
    (fieldId, value) => {
      setValue(`specialFields.${fieldId}`, value, { shouldDirty: true });
    },
    [setValue]
  );

  const handleSubmitForm = handleSubmit(async (values) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim?.() || null,
        img: values.img?.trim?.() || null,
        price: Number(values.price),
        brandId: Number(values.brandId),
        statusId: Number(values.statusId),
        typeId: Number(values.typeId),
        specialFields: {},
      };

      const preparedSpecialFields = {};
      Object.entries(values.specialFields || {}).forEach(([fieldId, rawValue]) => {
        const meta =
          assignedFieldsMap[fieldId] ||
          catalogById[fieldId];
        const normalized = castValueForSubmit(rawValue, meta?.datatypeName);
        if (normalized !== null && typeof normalized !== "undefined") {
          preparedSpecialFields[fieldId] = normalized;
        }
      });
      payload.specialFields = preparedSpecialFields;

      if (product?.id) {
        await onUpdate(product.id, payload);
      } else {
        await onCreate(payload);
      }
      handleClose();
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  const renderSpecialFields = () => {
    if (!typeIdValue) {
      return (
        <Alert severity="info">
          Select a product type to configure special fields.
        </Alert>
      );
    }

    if (assignedLoading) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading fields…</Typography>
        </Box>
      );
    }

    if (assignedError) {
      return (
        <Alert severity="error">{assignedError}</Alert>
      );
    }

    if (!assignedFields.length) {
      return (
        <Alert severity="info">No special fields are assigned to this product type.</Alert>
      );
    }

    return (
      <Stack spacing={2}>
        {assignedFields.map((field) => {
          const fieldId = String(field.id);
          const type = (field.datatypeName || "").toLowerCase();
          const value = specialFieldsValues?.[fieldId];

          if (type === "boolean") {
            return (
              <FormControlLabel
                key={field.id}
                control={
                  <Checkbox
                    checked={Boolean(value)}
                    onChange={(event) =>
                      handleSpecialFieldChange(fieldId, event.target.checked)
                    }
                  />
                }
                label={field.name}
              />
            );
          }

          let inputType = "text";
          const inputProps = {};
          if (type === "integer") {
            inputType = "number";
            inputProps.step = 1;
          } else if (type === "decimal") {
            inputType = "number";
            inputProps.step = "0.01";
          }

          return (
            <TextField
              key={field.id}
              label={field.name}
              type={inputType}
              value={value ?? ""}
              onChange={(event) =>
                handleSpecialFieldChange(fieldId, event.target.value)
              }
              fullWidth
              inputProps={inputProps}
            />
          );
        })}
      </Stack>
    );
  };

  return (
    <EditorDrawer
      open={open}
      title={product ? "Edit Product" : "Create Product"}
      onClose={handleClose}
      onSubmit={handleSubmitForm}
      isSubmitting={isSubmitting}
      width={500}
    >
      <Stack spacing={2}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <TextField
          label="Name"
          fullWidth
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={3}
          {...register("description")}
          error={!!errors.description}
          helperText={errors.description?.message}
        />
        <TextField
          label="Image URL"
          fullWidth
          {...register("img")}
          error={!!errors.img}
          helperText={errors.img?.message}
        />
        <TextField
          label="Price"
          type="number"
          fullWidth
          inputProps={{ step: "0.01", min: 0 }}
          {...register("price")}
          error={!!errors.price}
          helperText={errors.price?.message}
        />
        <Controller
          name="brandId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Brand"
              fullWidth
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(
                  event.target.value === "" ? "" : Number(event.target.value)
                )
              }
              error={!!errors.brandId}
              helperText={errors.brandId?.message}
            >
              <MenuItem value="">Select brand</MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.id}>
                  {brand.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="statusId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Status"
              fullWidth
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(
                  event.target.value === "" ? "" : Number(event.target.value)
                )
              }
              error={!!errors.statusId}
              helperText={errors.statusId?.message}
            >
              <MenuItem value="">Select status</MenuItem>
              {productStatuses.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="typeId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Product Type"
              fullWidth
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(
                  event.target.value === "" ? "" : Number(event.target.value)
                )
              }
              error={!!errors.typeId}
              helperText={errors.typeId?.message}
            >
              <MenuItem value="">Select type</MenuItem>
              {productTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Special Fields
          </Typography>
          {renderSpecialFields()}
        </Box>
      </Stack>
    </EditorDrawer>
  );
}
