import React from "react";
import { Controller } from "react-hook-form";
import { InputLabel, FormControl, Select, MenuItem } from "@mui/material";

const SelectField = ({
  control,
  name,
  label,
  options = [],
  error,
  onchange = () => {},
}) => (
  <Controller
    control={control}
    name={name}
    defaultValue=""
    render={({ field }) => (
      <FormControl fullWidth error={!!error}>
        <InputLabel id={`${name}-label`}>{label}</InputLabel>
        <Select
          labelId={`${name}-label`}
          label={label}
          {...field}
          onChange={(e) => {
            field.onChange(e);
            onchange(e);
          }}
        >
          {options.map((option, index) => (
            <MenuItem key={`${name}_${index}`} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )}
  />
);

export default SelectField;
