import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  FormHelperText,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import EditorDrawer from "../../../../admin/crud/EditorDrawer";
import productsApi from "../../../../api/productsApi";
import { API_URL } from "../../../../utils/apiService/ApiService";
import ReplayIcon from "@mui/icons-material/Replay";

const defaultValues = {
  productId: "",
  referencePrice: "",
};

const getErrorMessage = (error, fallback = "Failed to create entry") =>
  error?.response?.data?.message || error?.message || fallback;

export default function TradeInCatalogCreateDrawer({
  open,
  onClose,
  onCreate,
  products = [],
  existingProductIds = [],
  productsLoading = false,
}) {
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typeId, setTypeId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pickerOptions, setPickerOptions] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [discountMode, setDiscountMode] = useState("percent");
  const [percentValue, setPercentValue] = useState(10);
  const [manualAmount, setManualAmount] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setServerError(null);
      setIsSubmitting(false);
      setTypeId("");
      setBrandId("");
      setSearchInput("");
      setDebouncedSearch("");
      setPickerOptions([]);
      setPickerError(null);
      setSelectedProduct(null);
      setDiscountMode("percent");
      setPercentValue(10);
      setManualAmount("");
    }
  }, [open, reset]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const existingIdsSet = useMemo(
    () => new Set(existingProductIds || []),
    [existingProductIds]
  );

  const typeOptions = useMemo(() => {
    const map = new Map();
    (products || []).forEach((product) => {
      if (!product.typeId || !product.typeName) return;
      map.set(product.typeId, product.typeName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [products]);

  const brandOptions = useMemo(() => {
    const map = new Map();
    (products || []).forEach((product) => {
      if (typeId && product.typeId !== Number(typeId)) return;
      if (!product.brandId || !product.brandName) return;
      map.set(product.brandId, product.brandName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [products, typeId]);

  useEffect(() => {
    if (!brandId) return;
    const exists = brandOptions.some(
      (brand) => String(brand.id) === String(brandId)
    );
    if (!exists) {
      setBrandId("");
    }
  }, [brandOptions, brandId]);

  useEffect(() => {
    if (!open) return;
    setPickerLoading(true);
    setPickerError(null);
    let active = true;
    productsApi
      .search({
        search: debouncedSearch || undefined,
        typeId: typeId || undefined,
        brandId: brandId || undefined,
        limit: 50,
      })
      .then((data) => {
        if (!active) return;
        const filtered = (data || [])
          .filter((item) => !existingIdsSet.has(item.id))
          .map((item) => ({
            id: item.id,
            label: item.name,
            price:
              item.price === null || typeof item.price === "undefined"
                ? null
                : Number(item.price),
            img: item.img,
            brandName: item.brandName,
            typeName: item.typeName,
            secondary: [item.brandName, item.typeName]
              .filter(Boolean)
              .join(" • "),
          }));
        setPickerOptions(filtered);
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        setPickerError(
          err?.response?.data?.message || err?.message || "Failed to load products"
        );
        setPickerOptions([]);
      })
      .finally(() => {
        if (active) {
          setPickerLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, debouncedSearch, typeId, brandId, existingIdsSet]);

  const handleResetFilters = () => {
    setTypeId("");
    setBrandId("");
    setSearchInput("");
    setDebouncedSearch("");
  };

  const clampPercent = (value) => {
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(value, 0), 100);
  };

  const handlePercentChange = (delta) => {
    setPercentValue((prev) => clampPercent((Number(prev) || 0) + delta));
  };

  const referencePriceValue = watch("referencePrice");
  const normalizedReferencePrice = useMemo(() => {
    const num = Number(referencePriceValue);
    if (!Number.isFinite(num) || num <= 0) {
      return null;
    }
    return Number(num.toFixed(2));
  }, [referencePriceValue]);

  const percentCapAmount = useMemo(() => {
    if (normalizedReferencePrice === null) return null;
    const percent = clampPercent(Number(percentValue) || 0);
    return Number(((normalizedReferencePrice * percent) / 100).toFixed(2));
  }, [normalizedReferencePrice, percentValue]);

  const manualAmountNumber =
    manualAmount === "" ? null : Number(manualAmount);
  const manualInputError =
    discountMode === "manual" &&
    manualAmount !== "" &&
    (!Number.isFinite(manualAmountNumber) || manualAmountNumber < 0);

  const manualCapAmount =
    manualInputError || manualAmountNumber === null
      ? null
      : Number(Math.max(0, manualAmountNumber).toFixed(2));

  const effectiveCapAmount =
    discountMode === "percent" ? percentCapAmount : manualCapAmount;

  const formatCap = (cap) =>
    cap === null || typeof cap === "undefined" || Number.isNaN(cap)
      ? "--"
      : `$${Number(cap).toFixed(2)}`;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    if (!selectedProduct) {
      setServerError("Select product first");
      return;
    }
    setIsSubmitting(true);
    try {
      const referencePrice = Number(values.referencePrice);
      if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
        setServerError("Reference price must be a positive number");
        setIsSubmitting(false);
        return;
      }

      let capAmount = null;
      if (discountMode === "percent") {
        if (percentCapAmount === null) {
          setServerError("Adjust percent (0-100) or reference price to calculate cap");
          setIsSubmitting(false);
          return;
        }
        if (clampPercent(Number(percentValue) || 0) !== Number(percentValue)) {
          setServerError("Percent must be between 0 and 100");
          setIsSubmitting(false);
          return;
        }
        capAmount = percentCapAmount;
      } else {
        if (manualCapAmount === null) {
          setServerError("Enter payout cap amount");
          setIsSubmitting(false);
          return;
        }
        capAmount = manualCapAmount;
      }

      await onCreate({
        productId: Number(values.productId),
        referencePrice: Number(referencePrice.toFixed(2)),
        baseDiscountAmount: capAmount,
      });
      reset(defaultValues);
      onClose();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <EditorDrawer
      open={open}
      onClose={onClose}
      title="Add Product To Trade-in Catalog"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    >
      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}
      <Box component="form" onSubmit={(e) => e.preventDefault()}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Product type"
            value={typeId}
            onChange={(event) => setTypeId(event.target.value)}
            fullWidth
            helperText="Filter products by type"
          >
            <MenuItem value="">All types</MenuItem>
            {typeOptions.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Brand"
            value={brandId}
            onChange={(event) => setBrandId(event.target.value)}
            fullWidth
            helperText="Brand options adjust by selected type"
            disabled={!brandOptions.length}
          >
            <MenuItem value="">All brands</MenuItem>
            {brandOptions.map((brand) => (
              <MenuItem key={brand.id} value={brand.id}>
                {brand.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Button onClick={handleResetFilters} size="small">
            Reset filters
          </Button>
        </Box>
        <Controller
          name="productId"
          control={control}
          rules={{ required: "Product is required" }}
          render={({ field }) => (
            <Autocomplete
              options={pickerOptions}
              loading={pickerLoading || productsLoading}
              value={selectedProduct}
              onChange={(event, newValue) => {
                setSelectedProduct(newValue || null);
                field.onChange(newValue?.id || "");
                if (newValue?.price !== undefined && newValue?.price !== null) {
                  setValue("referencePrice", Number(newValue.price));
                }
              }}
              inputValue={searchInput}
              onInputChange={(event, newValue) => {
                setSearchInput(newValue || "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Product"
                  margin="normal"
                  error={!!errors.productId}
                  helperText={
                    errors.productId?.message ||
                    pickerError ||
                    "Search by name, optionally filter by type/brand"
                  }
                />
              )}
              getOptionLabel={(option) => option?.label || ""}
              isOptionEqualToValue={(option, value) =>
                option.id === (value?.id ?? value)
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <div>
                    <div>{option.label}</div>
                    {option.secondary && (
                      <small style={{ color: "#666" }}>
                        {option.secondary}
                      </small>
                    )}
                  </div>
                </li>
              )}
            />
          )}
        />
        {selectedProduct && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              gap: 2,
              alignItems: "center",
            }}
          >
            {selectedProduct.img && (
              <Box
                component="img"
                src={
                  selectedProduct.img.startsWith("http")
                    ? selectedProduct.img
                    : `${API_URL}${selectedProduct.img}`
                }
                alt={selectedProduct.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 1,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2">
                {selectedProduct.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {[selectedProduct.brandName, selectedProduct.typeName]
                  .filter(Boolean)
                  .join(" • ")}
              </Typography>
              {selectedProduct.price != null && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Current price: ${Number(selectedProduct.price).toFixed(2)}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        <Controller
          name="referencePrice"
          control={control}
          rules={{
            required: "Reference price is required",
            validate: (value) => {
              const num = Number(value);
              if (!Number.isFinite(num) || num <= 0) {
                return "Enter a positive number";
              }
              return true;
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              type="number"
              label="Reference price"
              margin="normal"
              fullWidth
              error={!!errors.referencePrice}
              helperText={errors.referencePrice?.message}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Use current price">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (selectedProduct?.price != null) {
                              const next = Number(selectedProduct.price);
                              setValue("referencePrice", next, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }
                          }}
                          disabled={selectedProduct?.price == null}
                        >
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Trade-in payout cap (ideal condition)
          </Typography>
          <ToggleButtonGroup
            value={discountMode}
            exclusive
            onChange={(event, next) => {
              if (next) {
                setDiscountMode(next);
              }
            }}
            size="small"
            color="primary"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="percent">Percent of reference price</ToggleButton>
            <ToggleButton value="manual">Manual amount</ToggleButton>
          </ToggleButtonGroup>

          {discountMode === "percent" && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handlePercentChange(-10)}
                  sx={{ height: 56, minWidth: 56, alignSelf: "flex-start" }}
                >
                  -10%
                </Button>
                <TextField
                  label="Percent"
                  type="number"
                  value={percentValue}
                  onChange={(event) =>
                    setPercentValue(
                      clampPercent(Number(event.target.value) || 0)
                    )
                  }
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  sx={{ width: 160 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handlePercentChange(10)}
                  sx={{ height: 56, minWidth: 56, alignSelf: "flex-start" }}
                >
                  +10%
                </Button>
              </Stack>
              <FormHelperText>0–100% of reference price</FormHelperText>
              <Typography variant="body2" color="text.secondary">
                Reference price × percent = payout cap. Adjust reference price to
                fine-tune base discount.
              </Typography>
              <Typography variant="subtitle2">
                Payout cap: {formatCap(percentCapAmount)}
              </Typography>
            </Stack>
          )}

          {discountMode === "manual" && (
            <Stack spacing={1}>
              <TextField
                label="Payout cap amount ($)"
                type="number"
                value={manualAmount}
                onChange={(event) => setManualAmount(event.target.value)}
                error={manualInputError}
                helperText={
                  manualInputError
                    ? "Enter a non-negative number"
                    : "Sets the max payout directly"
                }
                inputProps={{ min: 0, step: 0.01 }}
              />
              <Typography variant="subtitle2">
                Payout cap: {formatCap(manualCapAmount)}
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>
    </EditorDrawer>
  );
}
