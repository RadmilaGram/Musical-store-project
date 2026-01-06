// src/pages/TradeIn.jsx
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Box, Stack, Typography, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SelectField from "../components/formFields/SelectField";
import { useProductTypes } from "../hooks/useProductTypes";
import { useBrands } from "../hooks/useBrands";
import { useTradeInConfigs } from "../hooks/useTradeInConfigs";
import { useTradeIn } from "../hooks/useTradeIn";

export default function TradeIn() {
  const { types } = useProductTypes();
  const { brands } = useBrands();
  const {
    tradeInCatalog = [],
    conditions = [],
    loading,
    error,
    computeOffer,
  } = useTradeInConfigs();
  const { items: selectedList, add, remove, total } = useTradeIn();

  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      typeId: "",
      brandId: "",
      productId: "",
      conditionCode: "",
    },
  });

  const typeId = watch("typeId");
  const brandId = watch("brandId");
  const productId = watch("productId");
  const conditionCode = watch("conditionCode");

  const catalogItems = useMemo(
    () =>
      tradeInCatalog.map((entry) => ({
        id: entry.productId,
        name: entry.productName || entry.name,
        brand_name: entry.brandName || entry.brand_name || "",
        type_name: entry.typeName || entry.type_name || "",
        referencePrice: Number(entry.referencePrice ?? 0),
        payoutCap: Number(entry.baseDiscountAmount ?? entry.base_discount_amount ?? 0),
      })),
    [tradeInCatalog]
  );

  // Derive available types
  const availableTypes = types.filter((t) =>
    catalogItems.some((p) => p.type_name === t.name)
  );

  const selectedType = types.find((t) => String(t.id) === String(typeId));
  const selectedBrand = brands.find((b) => String(b.id) === String(brandId));

  // Filter brands by selected type
  const filteredBrands = typeId
    ? brands.filter((b) =>
        catalogItems.some(
          (p) => p.type_name === selectedType?.name && p.brand_name === b.name
        )
      )
    : [];

  // Filter products by selected type & brand
  const filteredProducts = brandId
    ? catalogItems.filter(
        (p) =>
          p.type_name === selectedType?.name &&
          p.brand_name === selectedBrand?.name
      )
    : [];

  const conditionOptions = conditions.map((condition) => ({
    id: condition.code,
    name: `${condition.code} (${Number(condition.percent ?? 0)}%)`,
  }));

  const onAdd = ({ productId, conditionCode }) => {
    const prod = filteredProducts.find(
      (p) => String(p.id) === String(productId)
    );
    if (!prod || !conditionCode) return;
    const expected = computeOffer({ productId, conditionCode });
    add({
      ...prod,
      conditionCode,
      expectedDiscount: expected,
    });
    reset();
  };

  const onRemove = (id) => {
    remove(id);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error loading products.</Typography>;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <form onSubmit={handleSubmit(onAdd)}>
        <Stack spacing={2}>
          <SelectField
            control={control}
            name="typeId"
            label="Product Type"
            options={availableTypes.map((t) => ({ id: t.id, name: t.name }))}
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
            options={filteredProducts.map((p) => ({ id: p.id, name: p.name }))}
            disabled={!brandId}
          />

          <SelectField
            control={control}
            name="conditionCode"
            label="Condition"
            options={conditionOptions}
            disabled={!productId || !conditionOptions.length}
          />

          <Button
            variant="contained"
            type="submit"
            disabled={!productId || !conditionCode}
          >
            Add
          </Button>
        </Stack>
      </form>

      {selectedList.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">
            Total Discount: ${total} (max discount at purchase 50%)
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {selectedList.map((item) => (
              <Box
                key={item.id}
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, bgcolor: "#fafafa", borderRadius: 1 }}
              >
                <Typography>
                  {item.name} • {item.brand_name} • {item.type_name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography>${item.expectedDiscount}</Typography>
                  <IconButton onClick={() => onRemove(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
