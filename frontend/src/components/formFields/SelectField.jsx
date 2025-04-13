import React from "react";
import { Controller } from "react-hook-form";
import {
    InputLabel,
    FormControl,
    Select,
    MenuItem,
  } from "@mui/material";


const SelectField = ({ control, name, label, options = [], error }) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControl fullWidth error={!!error}>
          <InputLabel id={`${name}-label`}>{label}</InputLabel>
          <Select labelId={`${name}-label`} label={label} {...field}>
            {options.map((option) => (
              <MenuItem key={name + option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );

  
export default SelectField;