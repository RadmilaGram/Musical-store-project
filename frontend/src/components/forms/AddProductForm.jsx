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
    // Список полей, которые НЕ относятся к special_fields
    const staticFields = [
      "name",
      "description",
      "img",
      "price",
      "brandId",
      "statusId",
      "typeId",
    ];

    // Выбираем все остальные — это dynamic fields
    const dynamicFields = Object.keys(data)
      .filter((key) => !staticFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

    // Добавляем в виде JSON-строки
    data.special_fields = JSON.stringify(dynamicFields);

    console.log("Final Data To Submit:", data);

    await addProduct(data);
    reset();
  });

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
