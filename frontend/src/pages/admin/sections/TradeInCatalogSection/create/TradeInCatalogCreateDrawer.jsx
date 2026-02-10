import React from "react";
import EditorDrawer from "../../../../../admin/crud/EditorDrawer";
import useTradeInCatalogCreateForm from "../../../../../forms/tradeInCatalog/useTradeInCatalogCreateForm";
import { useCreateTradeInCatalog } from "../../../../../features/admin/tradeInCatalog/useCreateTradeInCatalog";
import TradeInCatalogCreateForm from "./TradeInCatalogCreateForm";

export default function TradeInCatalogCreateDrawer({
  open,
  onClose,
  products,
  offers,
}) {
  const { createCatalogEntry, isSubmitting } = useCreateTradeInCatalog();

  const form = useTradeInCatalogCreateForm({ products });

  const handleUseCurrentPrice = () => {
    if (form.selectedProduct?.price != null) {
      form.setValue("referencePrice", Number(form.selectedProduct.price), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const handleClose = () => {
    form.resetForm();
    onClose();
  };

  const onSubmit = async (values) => {
    const capAmount =
      form.discountMode === "percent"
        ? form.percentCapAmount
        : form.manualCapAmount;
    await createCatalogEntry({
      productId: Number(values.productId),
      referencePrice: Number(values.referencePrice),
      baseDiscountAmount: capAmount,
    });
    form.resetForm();
    onClose();
  };

  return (
    <EditorDrawer
      open={open}
      onClose={handleClose}
      title="Add Product To Trade-in Catalog"
      onSubmit={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <TradeInCatalogCreateForm
        control={form.control}
        errors={form.errors}
        handleSubmit={form.handleSubmit}
        onSubmit={onSubmit}
        offers={offers}
        typeOptions={form.typeOptions}
        brandOptions={form.brandOptions}
        typeId={form.typeId}
        brandId={form.brandId}
        onTypeChange={(value) => form.setValue("typeId", value)}
        onBrandChange={(value) => form.setValue("brandId", value)}
        onResetFilters={form.handleResetFilters}
        pickerOptions={form.pickerOptions}
        pickerLoading={form.pickerLoading}
        pickerError={form.pickerError}
        searchValue={form.searchValue}
        onSearchChange={form.setSearchValue}
        selectedProduct={form.selectedProduct}
        onProductSelect={form.handleProductSelect}
        onUseCurrentPrice={handleUseCurrentPrice}
        discountMode={form.discountMode}
        onDiscountModeChange={form.setDiscountMode}
        percentValue={form.percentValue}
        onPercentChange={form.setPercentValue}
        onPercentStep={form.handlePercentStep}
        manualAmount={form.manualAmount}
        onManualAmountChange={form.setManualAmount}
        manualAmountError={form.manualAmountError}
        percentCapAmount={form.percentCapAmount}
        manualCapAmount={form.manualCapAmount}
        effectiveCapAmount={form.effectiveCapAmount}
        isSubmitting={isSubmitting}
      />
    </EditorDrawer>
  );
}
