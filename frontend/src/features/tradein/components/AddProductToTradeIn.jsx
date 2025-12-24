import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
} from "@mui/material";
import SelectField from "../../../components/formFields/SelectField";
import { useTradeinForm } from "../hooks/useTradeinForm";

const defaultValues = {
  typeId: "",
  brandId: "",
  productId: "",
  manualMode: false,
  discountPercent: 10,
  manualDiscount: "",
};

const findById = (collection, id) =>
  collection.find((item) => String(item.id) === String(id));

export default function AddProductToTradeIn() {
  const [successOpen, setSuccessOpen] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    register,
    reset,
    setValue,
    formState,
  } = useForm({
    defaultValues,
  });
  const { errors } = formState;
  const {
    types,
    brands,
    products,
    loading,
    error,
    isSubmitting,
    addTradeinProduct,
  } = useTradeinForm();

  const typeId = watch("typeId");
  const brandId = watch("brandId");
  const productId = watch("productId");
  const manualMode = watch("manualMode");
  const discountPercent = watch("discountPercent") || 0;
  const manualDiscount = watch("manualDiscount");

  const selectedType = findById(types, typeId);
  const selectedBrand = findById(brands, brandId);
  const selectedProduct = products.find(
    (product) => String(product.id) === String(productId)
  );
  const referencePrice = selectedProduct ? Number(selectedProduct.price) : 0;

  const filteredBrands =
    selectedType && products.length
      ? brands.filter((brand) =>
          products.some(
            (product) =>
              product.type_name === selectedType.name &&
              product.brand_name === brand.name
          )
        )
      : [];

  const filteredProducts =
    selectedType && selectedBrand
      ? products.filter(
          (product) =>
            product.type_name === selectedType.name &&
            product.brand_name === selectedBrand.name
        )
      : [];

  const percentDiscountAmount =
    referencePrice && discountPercent
      ? (referencePrice * discountPercent) / 100
      : 0;

  const handleChangePercent = (delta) => {
    const current = Number(watch("discountPercent") || 0);
    let next = current + delta;
    if (next < 1) next = 1;
    if (next > 100) next = 100;
    setValue("discountPercent", next, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (formValues) => {
    const product = products.find(
      (item) => String(item.id) === String(formValues.productId)
    );
    const refPrice = product ? Number(product.price) : null;

    let baseDiscountAmount = null;

    if (formValues.manualMode) {
      baseDiscountAmount =
        formValues.manualDiscount !== ""
          ? Number(formValues.manualDiscount)
          : null;
    } else if (refPrice != null && formValues.discountPercent) {
      baseDiscountAmount = (refPrice * formValues.discountPercent) / 100;
    }

    await addTradeinProduct({
      productId: formValues.productId,
      referencePrice: refPrice,
      baseDiscountAmount,
    });
    reset(defaultValues);
    setSuccessOpen(true);
  };

  const canSubmit =
    !!productId &&
    (manualMode ? manualDiscount !== "" : Number(discountPercent) > 0);

  if (loading) {
    return <Typography>Loading trade-in options...</Typography>;
  }

  if (error) {
    return (
      <Typography color="error">
        Unable to load trade-in options. Please try again later.
      </Typography>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <SelectField
          control={control}
          name="typeId"
          label="Product Type"
          options={types.map((type) => ({ id: type.id, name: type.name }))}
        />

        <SelectField
          control={control}
          name="brandId"
          label="Brand"
          options={filteredBrands.map((brand) => ({
            id: brand.id,
            name: brand.name,
          }))}
          disabled={!typeId}
        />

        <SelectField
          control={control}
          name="productId"
          label="Product"
          options={filteredProducts.map((product) => ({
            id: product.id,
            name: `${product.name} - Actual price: $${product.price}`,
          }))}
          disabled={!brandId}
        />

        {/* Текущая цена товара */}
        {selectedProduct && (
          <Box>
            <Typography variant="body2">
              Current price: <b>${referencePrice}</b>
            </Typography>
          </Box>
        )}

        {/* Переключатель ручного режима */}
        <FormControlLabel
          control={
            <Checkbox
              {...register("manualMode")}
              checked={!!manualMode}
              onChange={(event) =>
                setValue("manualMode", event.target.checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={!productId}
            />
          }
          label="Set discount manually"
        />

        {/* Процент + кнопки всегда отображаются, при manualMode disabled */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="flex-start"
        >
          <Button
            variant="outlined"
            type="button"
            onClick={() => handleChangePercent(-10)}
            disabled={!productId || manualMode}
          >
            -10%
          </Button>

          <TextField
            label="Discount (%)"
            type="number"
            sx={{ maxWidth: 160 }}
            slotProps={{
              input: { min: 1, max: 100, step: 1 },
            }}
            {...register("discountPercent", {
              required: !manualMode ? "Required" : false,
              min: { value: 1, message: "Min 1%" },
              max: { value: 100, message: "Max 100%" },
              valueAsNumber: true,
            })}
            error={!!errors.discountPercent}
            helperText={errors.discountPercent?.message}
            disabled={!productId || manualMode}
          />

          <Button
            variant="outlined"
            type="button"
            onClick={() => handleChangePercent(10)}
            disabled={!productId || manualMode}
          >
            +10%
          </Button>
        </Stack>

        {/* Финальная скидка */}
        {!manualMode && (
          <Box>
            <Typography variant="body2">
              Final discount amount:{" "}
              <b>{productId ? `$${percentDiscountAmount.toFixed(2)}` : "--"}</b>
            </Typography>
          </Box>
        )}

        {manualMode && (
          <TextField
            label="Discount amount"
            type="number"
            slotProps={{
              input: { min: 0, step: 1 },
            }}
            {...register("manualDiscount", {
              required: manualMode ? "Required" : false,
              min: { value: 0, message: "Must be ≥ 0" },
            })}
            error={!!errors.manualDiscount}
            helperText={errors.manualDiscount?.message}
            disabled={!productId}
          />
        )}

        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Add"}
        </Button>
      </Stack>
      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessOpen(false)}
          sx={{ width: "100%" }}
        >
          Product added to trade-in
        </Alert>
      </Snackbar>
    </Box>
  );
}
