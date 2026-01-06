import React, { useState } from "react";
import { FormProvider } from "react-hook-form";
import EditorDrawer from "../../../../admin/crud/EditorDrawer";
import useProductEditorForm from "../../../../forms/product/useProductEditorForm";
import useSaveProduct from "../../../../features/admin/products/useSaveProduct";
import uploadApi from "../../../../api/uploadApi";
import { API_URL } from "../../../../utils/apiService/ApiService";
import ProductEditorForm from "./ProductEditorForm";

export default function ProductEditorDrawer({
  open,
  product,
  onClose,
  brands,
  productTypes,
  productStatuses,
  specialFieldsCatalog,
}) {
  const {
    form,
    buildPayload,
    assignedFields,
    assignedLoading,
    resetForm,
    specialFieldValues,
  } = useProductEditorForm({
    product,
    specialFieldsCatalog,
    productStatuses,
  });

  const { saveProduct, isSubmitting } = useSaveProduct();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [serverError, setServerError] = useState(null);

  const onUploadImage = async (event, onChange) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setServerError(null);
    try {
      const response = await uploadApi.uploadImage(file);
      const imageUrl = response?.image_url || response;
      const finalUrl = imageUrl?.startsWith("http")
        ? imageUrl
        : `${API_URL}${imageUrl}`;
      onChange(finalUrl);
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await saveProduct(buildPayload({ ...values, id: product?.id }));
      resetForm();
      onClose();
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message);
    }
  });

  return (
    <EditorDrawer
      open={open}
      onClose={handleClose}
      title={product ? "Edit product" : "Add product"}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting || uploadingImage}
    >
      <FormProvider {...form}>
        <ProductEditorForm
          brands={brands}
          productTypes={productTypes}
          productStatuses={productStatuses}
          assignedFields={assignedFields}
          specialFieldValues={specialFieldValues}
          onUploadImage={onUploadImage}
          uploadingImage={uploadingImage}
          imgValue={form.watch("img")}
          onClose={handleClose}
          isSubmitting={isSubmitting || uploadingImage}
          serverError={serverError}
          onSubmit={onSubmit}
        />
      </FormProvider>
    </EditorDrawer>
  );
}
