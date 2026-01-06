import React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

const SpecialFieldsEditor = ({
  assignedFields,
  valuesByFieldId = {},
}) => {
  const { control, register } = useFormContext();
  if (!assignedFields?.length) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No special fields for selected product type.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {assignedFields.map((field) => {
        const fieldId = String(field.id);
        const datatype = (field.datatypeName || "").toLowerCase();
        const valueOptions =
          valuesByFieldId?.[fieldId] || valuesByFieldId?.[field.id] || [];

        if (datatype === "boolean") {
          return (
            <Controller
              key={field.id}
              name={`specialFields.${fieldId}`}
              control={control}
              render={({ field: controllerField }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!controllerField.value}
                      onChange={(event) =>
                        controllerField.onChange(event.target.checked)
                      }
                    />
                  }
                  label={field.name}
                />
              )}
            />
          );
        }

        if (valueOptions.length) {
          return (
            <Controller
              key={field.id}
              name={`specialFields.${fieldId}`}
              control={control}
              render={({ field: controllerField }) => (
                <>
                  <TextField
                    select
                    fullWidth
                    label={field.name}
                    value={
                      controllerField.value == null
                        ? ""
                        : String(controllerField.value)
                    }
                    onChange={(event) =>
                      controllerField.onChange(event.target.value)
                    }
                  >
                    <MenuItem value="" disabled>
                      <em>Select value</em>
                    </MenuItem>
                    {valueOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  {controllerField.value &&
                    !valueOptions.includes(String(controllerField.value)) && (
                      <FormHelperText>
                        Current value not in predefined list
                      </FormHelperText>
                    )}
                </>
              )}
            />
          );
        }

        return (
          <TextField
            key={field.id}
            label={field.name}
            type={datatype === "integer" || datatype === "decimal" ? "number" : "text"}
            {...register(`specialFields.${fieldId}`)}
            inputProps={{
              step: datatype === "decimal" ? 0.01 : 1,
            }}
          />
        );
      })}
    </Stack>
  );
};

export default SpecialFieldsEditor;
