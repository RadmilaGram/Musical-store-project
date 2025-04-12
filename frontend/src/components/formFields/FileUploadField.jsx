import React from "react";
import { Controller } from "react-hook-form";
import { Box, Button, Typography } from "@mui/material";

const FileUploadField = ({
  control,
  name,
  label = "Upload File",
  accept = "image/*",
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Box>
          <input
            type="file"
            accept={accept}
            id={`${name}-input`}
            style={{ display: "none" }}
            onChange={(e) => field.onChange(e.target.files?.[0] || null)}
          />
          <label htmlFor={`${name}-input`}>
            <Button
              variant="outlined"
              component="span"
              color={fieldState.error ? "error" : "primary"}
            >
              {label}
            </Button>
          </label>

          {field.value && (
            <Typography sx={{ mt: 1 }}>
              Selected file: {field.value.name}
            </Typography>
          )}

          {fieldState.error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {fieldState.error.message}
            </Typography>
          )}
        </Box>
      )}
    />
  );
};

export default FileUploadField;
