// src/pages/TradeIn.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Box, Stack, Typography, Button, IconButton, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SelectField from "../components/formFields/SelectField";
import TradeInHeader from "../components/trade-in/TradeInHeader";
import TradeInProductPreview from "../components/trade-in/TradeInProductPreview";
import TradeInSelectedList from "../components/trade-in/TradeInSelectedList";
import TradeInSelectedSummary from "../components/trade-in/TradeInSelectedSummary";
import { useProductTypes } from "../hooks/useProductTypes";
import { useBrands } from "../hooks/useBrands";
import { useTradeInConfigs } from "../hooks/useTradeInConfigs";
import { useTradeIn } from "../hooks/useTradeIn";
import { useSpecialFieldsCrud } from "../features/admin/specialFields/useSpecialFieldsCrud";
import { useProductById } from "../use-cases/products/useProductById";
import { computeTradeInOffer } from "../use-cases/trade-in/computeTradeInOffer";
import { API_URL } from "../utils/apiService/ApiService";

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
  const { items: selectedList, add, remove, increment, decrement } = useTradeIn();
  const {
    items: specialFieldsCatalog,
    status: specialFieldsStatus,
    ensureLoaded: ensureSpecialFieldsLoaded,
  } = useSpecialFieldsCrud();
  const failedImagesRef = useRef(new Set());
  const [, setImageErrorTick] = useState(0);

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
        baseDiscountAmount: Number(
          entry.baseDiscountAmount ?? entry.base_discount_amount ?? 0
        ),
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

  const sortedConditions = [...conditions].sort(
    (a, b) => Number(b.percent ?? 0) - Number(a.percent ?? 0)
  );
  const conditionOptions = sortedConditions.map((condition) => ({
    id: condition.code,
    name: condition.code,
  }));

  useEffect(() => {
    ensureSpecialFieldsLoaded().catch(() => {});
  }, [ensureSpecialFieldsLoaded]);

  const selectedCatalogEntry = filteredProducts.find(
    (p) => String(p.id) === String(productId)
  );
  const selectedCondition = conditions.find(
    (item) => String(item.code) === String(conditionCode)
  );
  const { data: productDetails, isLoading: isProductLoading } =
    useProductById(productId);
  const addImg =
    productDetails?.img ??
    productDetails?.productImg ??
    productDetails?.productImgPath ??
    selectedCatalogEntry?.productImg ??
    selectedCatalogEntry?.img ??
    null;
  const offer =
    selectedCatalogEntry && selectedCondition
      ? computeTradeInOffer(selectedCatalogEntry, selectedCondition)
      : null;

  const onAdd = ({ productId, conditionCode }) => {
    const prod = filteredProducts.find(
      (p) => String(p.id) === String(productId)
    );
    if (!prod || !conditionCode) return;
    const expected = computeOffer({ productId, conditionCode });
    const productKeyRaw =
      selectedCatalogEntry?.id ??
      selectedCatalogEntry?.productId ??
      productId;
    const productKey = productKeyRaw ? String(productKeyRaw) : "";
    if (!productKey) return;
    const tradeInKey = `${productKey}__${conditionCode}`;
    add({
      ...prod,
      conditionCode,
      expectedDiscount: expected,
      productImg: addImg,
      quantity: 1,
      tradeInKey,
    });
    reset();
  };

  const onRemove = (tradeInKey) => {
    remove(tradeInKey);
  };
  const resolveAssetUrl = (raw) => {
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    if (raw.startsWith("/")) return new URL(raw, API_URL).toString();
    if (raw.startsWith("uploads/")) {
      return new URL(`/${raw}`, API_URL).toString();
    }
    return raw;
  };
  const totalDiscount = Math.round(
    selectedList.reduce(
      (sum, item) =>
        sum + (Number(item.expectedDiscount) || 0) * (item.quantity ?? 1),
      0
    )
  );
  const handleImageError = (item) => {
    const imageKey = String(
      item?.prod?.id ??
        item?.prod?.productId ??
        item?.productId ??
        item?.id ??
        `${item?.prod?.name ?? "unknown"}-${item?.conditionCode ?? ""}`
    );
    failedImagesRef.current.add(imageKey);
    setImageErrorTick((tick) => tick + 1);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error loading products.</Typography>;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <TradeInHeader
        title="Trade-In"
        subtitle="Select items you want to trade in to see your estimated discount."
      />
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
            label={
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <span>Condition</span>
                <Tooltip title="Condition affects your discount.">
                  <IconButton
                    size="small"
                    aria-label="Condition info"
                    sx={{ p: 0.25 }}
                  >
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
            options={conditionOptions}
            disabled={!productId || !conditionOptions.length}
          />

          {selectedCatalogEntry && (
            <TradeInProductPreview
              catalogEntry={selectedCatalogEntry}
              condition={selectedCondition || null}
              offer={offer}
              productDetails={productDetails}
              specialFieldsCatalog={specialFieldsCatalog}
              isSpecialFieldsLoading={specialFieldsStatus === "loading"}
              isLoading={isProductLoading}
            />
          )}

          <Button
            variant="contained"
            type="submit"
            disabled={!productId || !conditionCode || isProductLoading}
          >
            Add
          </Button>
          {isProductLoading && (
            <Typography variant="caption" color="text.secondary">
              Loading product details…
            </Typography>
          )}
        </Stack>
      </form>

      <Box sx={{ mt: 4 }}>
        <TradeInSelectedSummary totalDiscount={totalDiscount} />
        <TradeInSelectedList
          items={selectedList}
          resolveAssetUrl={(raw, item) => {
            const imageUrl = resolveAssetUrl(raw);
            if (!imageUrl) return null;
            const imageKey = String(
              item?.prod?.id ??
                item?.prod?.productId ??
                item?.productId ??
                item?.id ??
                `${item?.prod?.name ?? "unknown"}-${item?.conditionCode ?? ""}`
            );
            const hasImageError = failedImagesRef.current.has(imageKey);
            return hasImageError ? null : imageUrl;
          }}
          onImageError={handleImageError}
          onRemove={onRemove}
          onIncrement={increment}
          onDecrement={decrement}
        />
      </Box>
    </Box>
  );
}
