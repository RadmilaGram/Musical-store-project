import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Button,
  Stack,
  TextField,
} from "@mui/material";

import { Textarea } from "@mui/joy";

import {
  addProduct,
} from "../../utils/apiService/ApiService";

import { useBrands } from "../../hooks/useBrands";
import { useProductTypes } from "../../hooks/useProductTypes";
import { useStatuses } from "../../hooks/useStatuses";
import { useAddProductForm } from "../../hooks/useAddProductForm";
import FileUploadField from "../../components/formFields/FileUploadField";
import SelectField from "../../components/formFields/SelectField";

function AddProductForm() {

  const brands = useBrands();
  const types = useProductTypes();
  const statuses = useStatuses();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useAddProductForm();

  const submitFn = handleSubmit(async (data) => {
    console.log(data);

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
            render={({ field }) => (
              <Textarea
                label="description"
                {...field}
                error={!!errors?.description}
                placeholder="Description"
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
          <Button
            variant="contained"
            color="primary"
            type="submit"
          >
            Add
          </Button>
        </Stack>
      </form>
    </>
  );
}

export default AddProductForm;
