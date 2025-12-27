import React from "react";
import {
  Box,
  Button,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { API_URL } from "../../../../utils/apiService/ApiService";
import { Controller, useFormContext } from "react-hook-form";
import SpecialFieldsEditor from "./components/SpecialFieldsEditor";

export default function ProductEditorForm({
  brands = [],
  productTypes = [],
  productStatuses = [],
  assignedFields = [],
  specialFieldValues = {},
  onUploadImage,
  uploadingImage,
  imgValue,
  onClose,
  isSubmitting,
  serverError,
  onSubmit,
}) {
  const formContext = useFormContext();
  if (!formContext?.register || !formContext?.control) {
    return null;
  }
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = formContext;

  const safeBrands = (brands ?? []).filter(Boolean);
  const safeTypes = (productTypes ?? []).filter(Boolean);
  const safeStatuses = (productStatuses ?? []).filter(Boolean);
  const imgPreview =
    imgValue && !String(imgValue).startsWith("http")
      ? `${API_URL}${imgValue}`
      : imgValue;

  return (
    <Box component="form" onSubmit={onSubmit}>
      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}
      <Stack spacing={2}>
        <TextField
          label="Name"
          error={!!errors.name}
          helperText={errors.name?.message}
          {...register("name")}
        />
        <TextField
          label="Description"
          multiline
          rows={3}
          error={!!errors.description}
          helperText={errors.description?.message}
          {...register("description")}
        />
        <TextField
          label="Price"
          type="number"
          error={!!errors.price}
          helperText={errors.price?.message}
          inputProps={{ min: 0, step: 0.01 }}
          {...register("price")}
        />
        <Controller
          name="brandId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Brand"
              error={!!errors.brandId}
              helperText={errors.brandId?.message}
            >
              {safeBrands.map((brand) => (
                <MenuItem key={brand.id} value={brand.id}>
                  {brand.name ?? ""}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="statusId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Status"
              error={!!errors.statusId}
              helperText={errors.statusId?.message}
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value)}
            >
              {safeStatuses.map((status) => (
                <MenuItem key={status.id} value={String(status.id)}>
                  {status.name ?? ""}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="typeId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Product type"
              error={!!errors.typeId}
              helperText={errors.typeId?.message}
            >
              {safeTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name ?? ""}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="img"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Image URL"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      component="label"
                      startIcon={<UploadIcon />}
                      disabled={uploadingImage}
                    >
                      Upload
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(event) => onUploadImage(event, field.onChange)}
                      />
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        {imgPreview ? (
          <Box
            component="img"
            src={imgPreview}
            alt="Preview"
            sx={{
              width: "100%",
              height: 200,
              objectFit: "cover",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Upload image to preview
          </Typography>
        )}
        <SpecialFieldsEditor
          assignedFields={assignedFields}
          valuesByFieldId={specialFieldValues}
        />
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Box>
  );
}
