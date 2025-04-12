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
             <Box sx={{ mt: 1 }}>
             <Typography>Selected: {field.value.name}</Typography>
             <img
               src={URL.createObjectURL(field.value)}
               alt="preview"
               style={{ marginTop: 8, maxHeight: 300, borderRadius: 8 }}
             />
           </Box>
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
