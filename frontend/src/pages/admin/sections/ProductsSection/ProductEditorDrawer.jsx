import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import EditorDrawer from "../../../../admin/crud/EditorDrawer";
import productTypeSpecialFieldsApi from "../../../../api/productTypeSpecialFieldsApi";
import specialFieldValuesApi from "../../../../api/specialFieldValuesApi";
import uploadApi from "../../../../api/uploadApi";
import { API_URL } from "../../../../utils/apiService/ApiService";

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
      if (
        originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
      ) {
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
      if (
        originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
      ) {
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

const parseSpecialFieldsRaw = (raw) => {
  if (!raw) {
    return null;
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to parse special fields JSON", err);
  }
  return null;
};

const normalizeInitialValue = (value, datatypeName) => {
  const type = (datatypeName || "").toLowerCase();
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const trimmed = value.trim().toLowerCase();
      if (!trimmed) return false;
      return trimmed === "true" || trimmed === "1" || trimmed === "yes";
    }
    return Boolean(value);
  }
  if (type === "integer") {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isNaN(num) ? "" : Math.trunc(num);
  }
  if (type === "decimal") {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isNaN(num) ? "" : num;
  }
  return value == null ? "" : String(value);
};

const normalizeSpecialFieldsValues = (
  rawValues,
  assignedFieldsById,
  assignedFieldsByName
) => {
  if (!rawValues || typeof rawValues !== "object") {
    return {};
  }

  const entries = Object.entries(rawValues);
  if (!entries.length) {
    return {};
  }

  const normalized = {};

  entries.forEach(([key, value]) => {
    const field =
      (isNumericKey(key) && assignedFieldsById[String(key)]) ||
      assignedFieldsByName[key];
    if (!field) {
      return;
    }
    normalized[String(field.id)] = normalizeInitialValue(
      value,
      field.datatypeName
    );
  });

  return normalized;
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
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [fieldOptions, setFieldOptions] = useState({});
  const [fieldOptionsReady, setFieldOptionsReady] = useState(false);
  const [assignedLoaded, setAssignedLoaded] = useState(false);
  const bootstrappingRef = useRef(false);
  const userChangedTypeRef = useRef(false);
  const lastTypeRef = useRef(null);
  const initKeyRef = useRef(null);

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
    defaultValues: {
      ...defaultValues,
      specialFields: defaultValues.specialFields || {},
    },
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
  const imageValue = watch("img");

  const assignedFieldsMap = useMemo(() => {
    const map = {};
    (assignedFields || []).forEach((field) => {
      map[String(field.id)] = field;
    });
    return map;
  }, [assignedFields]);

  const assignedFieldsNameMap = useMemo(() => {
    const map = {};
    (assignedFields || []).forEach((field) => {
      if (field?.name) {
        map[field.name] = field;
      }
    });
    return map;
  }, [assignedFields]);

  const handleClose = useCallback(() => {
    onClose();
    reset(defaultValues);
    setAssignedFields([]);
    setAssignedError(null);
    setFieldOptions({});
    setFieldOptionsReady(false);
    setAssignedLoaded(false);
    bootstrappingRef.current = false;
    userChangedTypeRef.current = false;
    lastTypeRef.current = null;
    initKeyRef.current = null;
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setAssignedFields([]);
      setAssignedError(null);
      setFieldOptions({});
      setFieldOptionsReady(false);
      setAssignedLoaded(false);
      bootstrappingRef.current = false;
      userChangedTypeRef.current = false;
      lastTypeRef.current = null;
      initKeyRef.current = null;
      return;
    }

    if (product?.id) {
      bootstrappingRef.current = true;
      userChangedTypeRef.current = false;
      lastTypeRef.current = product.typeId ?? "";
      initKeyRef.current = null;
      reset(
        {
          ...defaultValues,
          name: product.name || "",
          description: product.description || "",
          img: product.img || "",
          price:
            typeof product.price === "number"
              ? product.price.toString()
              : product.price || "",
          brandId: product.brandId || "",
          statusId: product.statusId || "",
          typeId: product.typeId || "",
          specialFields: {},
        },
        { keepDirty: false }
      );
    } else {
      bootstrappingRef.current = false;
      userChangedTypeRef.current = false;
      lastTypeRef.current = "";
      reset(defaultValues, { keepDirty: false });
    }
    setServerError(null);
  }, [open, product, reset]);

  const loadFieldOptions = useCallback(async (typeId, fields) => {
    setFieldOptionsReady(false);
    const ids = (fields || [])
      .map((field) => Number(field?.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (!ids.length) {
      setFieldOptions({});
      setFieldOptionsReady(true);
      return;
    }

    try {
      const options = await specialFieldValuesApi.listBatch(ids);
      setFieldOptions(options || {});
      setFieldOptionsReady(true);
    } catch (error) {
      console.error("Failed to load special field values", error);
      setFieldOptions({});
      setFieldOptionsReady(true);
    }
  }, []);

  const loadAssignedFields = useCallback(
    async (typeId) => {
      setAssignedLoaded(false);
      if (!typeId) {
        setAssignedFields([]);
        setAssignedError(null);
        setFieldOptions({});
        setFieldOptionsReady(true);
        setAssignedLoaded(true);
        return;
      }
      setAssignedLoading(true);
      setAssignedError(null);
      let fetched = [];
      try {
        const data = await productTypeSpecialFieldsApi.listByType(typeId);
        fetched = Array.isArray(data) ? data : [];
        setAssignedFields(fetched);
        await loadFieldOptions(typeId, fetched);
      } catch (error) {
        setAssignedFields([]);
        setAssignedError(
          getErrorMessage(error, "Failed to load special fields")
        );
        setFieldOptions({});
        setFieldOptionsReady(true);
      } finally {
        setAssignedLoading(false);
        setAssignedLoaded(true);
      }
    },
    [loadFieldOptions]
  );

  useEffect(() => {
    if (!open) return;
    if (!typeIdValue) {
      setAssignedFields([]);
      setAssignedError(null);
      setFieldOptions({});
      setFieldOptionsReady(true);
      setAssignedLoaded(true);
      return;
    }
    loadAssignedFields(typeIdValue);
  }, [typeIdValue, loadAssignedFields, open]);

  useEffect(() => {
    if (!open) return;
    const currentType = typeIdValue ?? "";

    if (bootstrappingRef.current) {
      lastTypeRef.current = currentType;
      return;
    }

    if (
      lastTypeRef.current !== null &&
      currentType !== lastTypeRef.current
    ) {
      userChangedTypeRef.current = true;
    }

    if (!userChangedTypeRef.current) {
      lastTypeRef.current = currentType;
      return;
    }

    setValue("specialFields", {}, { shouldDirty: true });
    lastTypeRef.current = currentType;
  }, [typeIdValue, open, setValue]);

  useEffect(() => {
    if (!open) return;
    const allowedIds = new Set(
      (assignedFields || []).map((field) => String(field.id))
    );
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

  useEffect(() => {
    if (
      !open ||
      !product?.id ||
      !bootstrappingRef.current ||
      !typeIdValue ||
      assignedLoading ||
      !assignedLoaded ||
      !fieldOptionsReady ||
      !assignedFields.length
    ) {
      return;
    }

    const optionKeys = Object.keys(fieldOptions || {}).length;
    const initKey = `${product.id}:${typeIdValue}:${assignedFields.length}:${optionKeys}`;
    if (initKeyRef.current === initKey) {
      return;
    }

    const parsed = parseSpecialFieldsRaw(product.specialFieldsRaw) || {};
    const normalized = normalizeSpecialFieldsValues(
      parsed,
      assignedFieldsMap,
      assignedFieldsNameMap
    );

    const currentValues = getValues();
    reset(
      {
        ...currentValues,
        name: product.name || "",
        description: product.description || "",
        img: product.img || "",
        price:
          typeof product.price === "number"
            ? product.price.toString()
            : product.price || "",
        brandId: product.brandId || "",
        statusId: product.statusId || "",
        typeId: product.typeId || "",
        specialFields: normalized,
      },
      { keepDirty: false }
    );

    bootstrappingRef.current = false;
    userChangedTypeRef.current = false;
    lastTypeRef.current = typeIdValue ?? "";
    initKeyRef.current = initKey;
  }, [
    open,
    product,
    typeIdValue,
    assignedLoading,
    assignedLoaded,
    fieldOptionsReady,
    assignedFields,
    fieldOptions,
    assignedFieldsMap,
    assignedFieldsNameMap,
    reset,
    getValues,
  ]);

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
      Object.entries(values.specialFields || {}).forEach(
        ([fieldId, rawValue]) => {
          const meta = assignedFieldsMap[fieldId] || catalogById[fieldId];
          const normalized = castValueForSubmit(rawValue, meta?.datatypeName);
          if (normalized !== null && typeof normalized !== "undefined") {
            preparedSpecialFields[fieldId] = normalized;
          }
        }
      );
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
      return <Alert severity="error">{assignedError}</Alert>;
    }

    if (!assignedFields.length) {
      return (
        <Alert severity="info">
          No special fields are assigned to this product type.
        </Alert>
      );
    }

    return (
      <Stack spacing={2}>
        {assignedFields.map((field) => {
          const fieldId = String(field.id);
          const type = (field.datatypeName || "").toLowerCase();
          const options = fieldOptions[fieldId] || [];

          if (options.length) {
            return (
              <Controller
                key={field.id}
                name={`specialFields.${fieldId}`}
                control={control}
                render={({ field: controllerField }) => {
                  const uniqueOptions = Array.from(
                    new Set(options.map((option) => String(option)))
                  );
                  const valueString =
                    controllerField.value === null ||
                    typeof controllerField.value === "undefined"
                      ? ""
                      : String(controllerField.value);
                  const hasValue = valueString !== "";
                  const includesValue = uniqueOptions.includes(valueString);
                  const optionsWithCurrent =
                    hasValue && !includesValue
                      ? [valueString, ...uniqueOptions]
                      : uniqueOptions;
                  const helperText =
                    hasValue && !includesValue
                      ? "Current value not in predefined list"
                      : undefined;

                  return (
                    <TextField
                      select
                      label={field.name}
                      value={valueString}
                      onChange={(event) =>
                        controllerField.onChange(event.target.value)
                      }
                      fullWidth
                      helperText={helperText}
                    >
                      <MenuItem value="">Select value</MenuItem>
                      {optionsWithCurrent.map((option) => (
                        <MenuItem key={`${fieldId}-${option}`} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  );
                }}
              />
            );
          }

          if (type === "boolean") {
            return (
              <Controller
                key={field.id}
                name={`specialFields.${fieldId}`}
                control={control}
                render={({ field: controllerField }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(controllerField.value)}
                        onChange={(event) =>
                          controllerField.onChange(event.target.checked)
                        }
                      />
                    }
                    label={field.name}
                  />
                )}
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
            <Controller
              key={field.id}
              name={`specialFields.${fieldId}`}
              control={control}
              render={({ field: controllerField }) => (
                <TextField
                  label={field.name}
                  type={inputType}
                  value={controllerField.value ?? ""}
                  onChange={(event) =>
                    controllerField.onChange(event.target.value)
                  }
                  fullWidth
                  inputProps={inputProps}
                />
              )}
            />
          );
        })}
      </Stack>
    );
  };

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleImageUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const data = await uploadApi.uploadImage(file);
        const imageUrl = data?.image_url;
        if (imageUrl) {
          setValue("img", imageUrl, { shouldDirty: true });
          setSnackbar({
            open: true,
            message: "Image uploaded",
            severity: "success",
          });
        } else {
          setSnackbar({
            open: true,
            message: "Upload response missing image_url",
            severity: "error",
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: getErrorMessage(error, "Failed to upload image"),
          severity: "error",
        });
      } finally {
        setUploading(false);
        event.target.value = null;
      }
    },
    [setValue]
  );

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
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Image URL"
              fullWidth
              InputProps={{ readOnly: true }}
              {...register("img")}
              error={!!errors.img}
              helperText={errors.img?.message}
            />
            <input
              type="file"
              accept="image/*"
              id="product-image-upload"
              style={{ display: "none" }}
              onChange={handleImageUpload}
              disabled={uploading}
            />
            <label htmlFor="product-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </label>
            {uploading && <CircularProgress size={24} />}
          </Stack>
          {imageValue && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">Preview:</Typography>
              <Box
                component="img"
                src={`${API_URL}${imageValue}`}
                alt="Product"
                sx={{ mt: 1, maxHeight: 180, borderRadius: 1 }}
              />
            </Box>
          )}
        </Box>
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={closeSnackbar}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </EditorDrawer>
  );
}
