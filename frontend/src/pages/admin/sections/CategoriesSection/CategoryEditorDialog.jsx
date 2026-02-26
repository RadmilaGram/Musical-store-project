import React, { useEffect, useMemo, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { Controller, FormProvider, useForm } from "react-hook-form";
import EditorDialog from "../../../../admin/crud/EditorDialog";
import uploadApi from "../../../../api/uploadApi";
import { API_URL } from "../../../../utils/apiService/ApiService";
import {
  CATEGORY_FALLBACK_IMAGE,
  resolveCategoryImageUrl,
} from "../../../../utils/images/resolveCategoryImageUrl";
import categorySchema from "../../../../forms/category/categorySchema";

const defaultValues = {
  name: "",
  slug: "",
  img: "",
  sort_order: 0,
  is_active: 1,
};

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Failed to save category";

export default function CategoryEditorDialog({
  open,
  category,
  onClose,
  onSave,
}) {
  const methods = useForm({
    defaultValues,
    resolver: yupResolver(categorySchema),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const [serverError, setServerError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      setServerError(null);
      setUploadError(null);
      return;
    }

    reset(
      category
        ? {
            name: category.name || "",
            slug: category.slug || "",
            img: category.img || "",
            sort_order: Number.isInteger(Number(category.sort_order))
              ? Number(category.sort_order)
              : 0,
            is_active: Number(category.is_active) === 0 ? 0 : 1,
          }
        : defaultValues
    );
    setServerError(null);
    setUploadError(null);
  }, [open, category, reset]);

  const imgValue = watch("img");
  const fallbackPreview = resolveCategoryImageUrl(CATEGORY_FALLBACK_IMAGE, API_URL);
  const imgPreview = useMemo(() => {
    return resolveCategoryImageUrl(
      imgValue || CATEGORY_FALLBACK_IMAGE,
      API_URL
    );
  }, [imgValue]);

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadApi.uploadImage(file);
      const imagePath = response?.image_url || "";
      setValue("img", imagePath, { shouldValidate: true, shouldDirty: true });
    } catch (error) {
      setUploadError(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const submitForm = handleSubmit(async (values) => {
    setServerError(null);
    setIsSaving(true);
    try {
      await onSave({
        ...values,
        id: category?.id,
        is_active: Number(values.is_active) === 0 ? 0 : 1,
        sort_order: Number(values.sort_order) || 0,
      });
      onClose();
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <EditorDialog
      open={open}
      title={category ? "Edit Category" : "Add Category"}
      onClose={onClose}
      onSubmit={submitForm}
      isSubmitting={isSaving || isUploading}
      submitText={category ? "Save" : "Create"}
    >
      <FormProvider {...methods}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          {uploadError && <Alert severity="error">{uploadError}</Alert>}

          <TextField
            label="Name"
            fullWidth
            autoFocus
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <TextField
            label="Slug"
            fullWidth
            {...register("slug")}
            error={!!errors.slug}
            helperText={errors.slug?.message || "Lowercase, numbers, hyphens"}
            onChange={(event) => {
              setValue("slug", event.target.value.toLowerCase(), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />

          <Controller
            name="img"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Image path"
                fullWidth
                error={!!errors.img}
                helperText={errors.img?.message || "Use /uploads/... or /images/... path"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        component="label"
                        startIcon={<UploadIcon />}
                        disabled={isUploading}
                      >
                        Upload
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleUploadImage}
                        />
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Box
            sx={{
              width: "100%",
              aspectRatio: "16 / 14",
              minHeight: 300,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src={imgPreview}
              alt="Category preview"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
              onError={(event) => {
                event.target.src = fallbackPreview;
              }}
            />
          </Box>

          <TextField
            label="Sort order"
            type="number"
            fullWidth
            inputProps={{ min: 0, step: 1 }}
            {...register("sort_order")}
            error={!!errors.sort_order}
            helperText={
              errors.sort_order?.message ||
              "Lower number shows first (e.g., 10 before 20)"
            }
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={Number(field.value) === 1}
                    onChange={(event) =>
                      field.onChange(event.target.checked ? 1 : 0)
                    }
                  />
                }
                label="Active"
              />
            )}
          />
        </Stack>
      </FormProvider>
    </EditorDialog>
  );
}
