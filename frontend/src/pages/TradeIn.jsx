// src/pages/TradeIn.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { Box, Stack, Typography, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SelectField from "../components/formFields/SelectField";
import { useProductTypes } from "../hooks/useProductTypes";
import { useBrands } from "../hooks/useBrands";
import { useProducts } from "../hooks/useProducts";
import { useTradeInConfigs } from "../hooks/useTradeInConfigs";
import { useTradeIn } from "../hooks/useTradeIn";

// Condition options mapping with discount factors
const stateOptions = [
  { id: 1, name: "Ideal", factor: 1.00 },
  { id: 2, name: "Almost New", factor: 0.85 },
  { id: 3, name: "Good", factor: 0.70 },
  { id: 4, name: "Fair", factor: 0.55 },
  { id: 5, name: "Worn", factor: 0.40 },
  { id: 6, name: "Broken", factor: 0.25 },
];

export default function TradeIn() {
  const { types } = useProductTypes();
  const { brands } = useBrands();
  const { data: products = [], loading, error } = useProducts();
  const { tradeInConfigs } = useTradeInConfigs();
  const { items: selectedList, add, remove, total } = useTradeIn();

  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: { typeId: "", brandId: "", productId: "", stateId: "" },
  });

  const typeId = watch("typeId");
  const brandId = watch("brandId");
  const productId = watch("productId");
  const stateId = watch("stateId");

  // Build available products list from configs
  const available = tradeInConfigs
    .map((cfg) => {
      const prod = products.find((p) => p.id === cfg.id);
      return prod ? { ...prod, baseDiscount: cfg.discount } : null;
    })
    .filter(Boolean);

  // Derive available types
  const availableTypes = types.filter((t) => available.some((p) => p.type_name === t.name));

  // Filter brands by selected type
  const filteredBrands = typeId
    ? brands.filter((b) =>
        available.some(
          (p) => p.type_name === types.find((t) => t.id === Number(typeId))?.name && p.brand_name === b.name
        )
      )
    : [];

  // Filter products by selected type & brand
  const filteredProducts = brandId
    ? available.filter(
        (p) =>
          p.type_name === types.find((t) => t.id === Number(typeId))?.name &&
          p.brand_name === brands.find((b) => b.id === Number(brandId))?.name
      )
    : [];

  const onAdd = ({ productId, stateId }) => {
    const prod = filteredProducts.find((p) => p.id === productId);
    const stateOpt = stateOptions.find((s) => s.id === stateId);
    if (!prod || !stateOpt) return;
    const expected = Math.round(prod.baseDiscount * stateOpt.factor);
    add({ ...prod, stateId, expectedDiscount: expected });
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
            name="stateId"
            label="Condition"
            options={stateOptions.map((s) => ({ id: s.id, name: s.name }))}
            disabled={!productId}
          />

          <Button variant="contained" type="submit" disabled={!productId || !stateId}>
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
