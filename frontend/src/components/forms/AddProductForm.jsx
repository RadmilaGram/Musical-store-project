import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";

import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import { addProduct } from "../../utils/apiService/ApiService";

import { useBrands } from "../../hooks/useBrands";
import { useProductTypes } from "../../hooks/useProductTypes";
import { useStatuses } from "../../hooks/useStatuses";
import { useAddProductForm } from "../../hooks/useAddProductForm";
import { useSpecialFieldDT } from "../../hooks/useSpecialFieldDT";
import { useProductTypeSpecialFields } from "../../hooks/useProductTypeSpecialFields";
import FileUploadField from "../../components/formFields/FileUploadField";
import SelectField from "../../components/formFields/SelectField";
import SelectFieldWithHook from "../../components/formFields/SelectFieldWithHook";

function AddProductForm() {
  const { brands } = useBrands();
  const { types } = useProductTypes();
  const { specialFieldDT } = useSpecialFieldDT();
  const { productTypeSpecialFields, fetchProductTypeSpecialFields } =
    useProductTypeSpecialFields();
  const statuses = useStatuses();

  const getIdName = (serchId) => {
    for (let row in specialFieldDT) {
      if (specialFieldDT[row].id == serchId) {
        return specialFieldDT[row];
      }
    }
    return { id: -1 };
  };

  const getInputByType = (item) => {
    const fieldData = getIdName(item.field_dt);
    const safeName = item.field_name.replace(/\s/g, ""); // Уникальное имя

    if (fieldData.name === "boolean") {
      return (
        <Controller
          control={control}
          name={safeName}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label={item.field_name}
            />
          )}
        />
      );
    }

    if (fieldData.name === "string") {
      return (
        <SelectFieldWithHook
          control={control}
          errors={errors}
          name={safeName}
          label={item.field_name}
          options={brands}
          id={item.field_id}
        />
      );
    }

    return (
      <Controller
        control={control}
        name={safeName}
        defaultValue={0}
        render={({ field }) => (
          <TextField
            {...field}
            label={item.field_name}
            fullWidth
            error={!!errors?.[safeName]}
            helperText={errors?.[safeName]?.message}
            type="number"
          />
        )}
      />
    );
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useAddProductForm(productTypeSpecialFields || []);

  const submitFn = handleSubmit(async (data) => {
    // 1) найдём в data все ключи, не входящие в static
    const staticList = ["name","description","img","price","brandId","statusId","typeId"];
    const dynamicKeys = Object.keys(data).filter(k => !staticList.includes(k));
  
    // 2) для каждого динамического ключа найдём исходный item по совпадению safeName
    const specialFieldsPayload = {};
    dynamicKeys.forEach((key) => {
      const item = productTypeSpecialFields.find(it =>
        it.field_name.replace(/\s/g, "") === key
      );
      if (item) {
        // originalKey — с пробелами
        specialFieldsPayload[item.field_name] = data[key];
        delete data[key];
      }
    });
  
    // 3) формируем итоговый payload
    const payload = {
      ...data,
      special_fields: JSON.stringify(specialFieldsPayload),
    };
  
    console.log("Final payload:", payload);
    await addProduct(payload);
    reset();
  }, (errors) => console.log("Validation errors:", errors));
  

  return (
    <>
      <form onSubmit={submitFn}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                label="Name (model)"
                {...field}
                error={!!errors?.name}
                helperText={errors?.name?.message}
              />
            )}
          />

          <SelectField
            control={control}
            name="typeId"
            label="Type"
            options={types}
            error={errors?.typeId}
            onchange={(e) => fetchProductTypeSpecialFields(e.target.value)}
          />

          <SelectField
            control={control}
            name="brandId"
            label="Brand"
            options={brands}
            error={errors?.brandId}
          />

          <SelectField
            control={control}
            name="statusId"
            label="Status"
            options={statuses}
            error={errors?.statusId}
          />
          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Description"
                multiline
                minRows={3}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <TextField
                label="Price"
                {...field}
                error={!!errors?.price}
                helperText={errors?.price?.message}
                type="number"
              />
            )}
          />
          <FileUploadField
            name="img"
            control={control}
            label="Upload Image"
            accept="image/*"
          />

          {productTypeSpecialFields?.length > 0 && (
            <>
              <Typography variant="h4" component="h4" sx={{ mt: "30px" }}>
                Special field:
              </Typography>

              {productTypeSpecialFields.map((item) => {
                return (
                  <Box
                    key={`special-field-${item.field_id}-${item.field_name}`}
                  >
                    {getInputByType(item)}
                  </Box>
                );
              })}
            </>
          )}
          <Button variant="contained" color="primary" type="submit">
            Add
          </Button>
        </Stack>
      </form>
    </>
  );
}

export default AddProductForm;
