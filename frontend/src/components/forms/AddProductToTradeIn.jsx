// src/admin/AddProductToTradeIn.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { Box, Button, Stack, TextField } from "@mui/material";
import SelectField from "../formFields/SelectField";
import { useProductTypes } from "../../hooks/useProductTypes";
import { useBrands } from "../../hooks/useBrands";
import { useProducts } from "../../hooks/useProducts";
import { addTradeInProduct } from "../../utils/apiService/ApiService";

export default function AddProductToTradeIn() {
  const { types } = useProductTypes();
  const { brands } = useBrands();
  const { data: products } = useProducts();

  const {
    control,
    handleSubmit,
    watch,
    register,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      typeId: "",
      brandId: "",
      productId: "",
      maxDiscount: "",
    },
  });

  const typeId = watch("typeId");
  const brandId = watch("brandId");
  const maxDiscount = watch("maxDiscount");

  // Determine selected type and brand by ID
  const selectedType = types.find((t) => t.id === typeId);
  const selectedBrand = brands.find((b) => b.id === brandId);

  // Filter brands that have products of the selected type
  const filteredBrands = brands.filter((b) =>
    products.some(
      (p) => p.type_name === selectedType?.name && p.brand_name === b.name
    )
  );

  // Filter products matching both selected type name and brand name
  const filteredProducts = products.filter(
    (p) =>
      p.type_name === selectedType?.name && p.brand_name === selectedBrand?.name
  );

  const onSubmit = async (data) => {
    const payload = {
      product_id: data.productId,
      discount: parseFloat(data.maxDiscount),
    };
    try {
      await addTradeInProduct(payload);
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <SelectField
          control={control}
          name="typeId"
          label="Product Type"
          options={types.map((t) => ({ id: t.id, name: t.name }))}
        />

        <SelectField
          control={control}
          name="brandId"
          label="Brand"
          options={filteredBrands.map((b) => ({ id: b.id, name: b.name }))}
          disabled={!typeId}
        />

        <SelectField
          control={control}
          name="productId"
          label="Product"
          options={filteredProducts.map((p) => ({
            id: p.id,
            name: p.name + " -- Actual price: $" + p.price,
          }))}
          disabled={!brandId}
        />

        <TextField
          label="Max Discount"
          type="number"
          {...register("maxDiscount", { required: "Required" })}
          error={!!errors.maxDiscount}
          helperText={errors.maxDiscount?.message}
          disabled={!watch("productId")}
        />

        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={!maxDiscount}
        >
          Add
        </Button>
      </Stack>
    </form>
  );
}
