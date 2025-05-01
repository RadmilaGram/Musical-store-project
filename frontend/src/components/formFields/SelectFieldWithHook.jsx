// src/components/formFields/SelectFieldWithHook.jsx
import React, { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { getSpecialFieldValues } from "../../utils/apiService/ApiService";

function mapOptions(data) {
  return data.map((item) => ({ id: item.field_id, name: item.value }));
}

export default function SelectFieldWithHook({ control, errors, name, label, id, onchange = () => {} }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (!id) return;
    getSpecialFieldValues(id)
      .then((data) => setOptions(mapOptions(data)))
      .catch(console.error);
  }, [id]);

  if (!options.length) return null;

  return (
    <Controller
      control={control}
      name={name}
      defaultValue=""
      render={({ field }) => (
        <FormControl fullWidth error={!!errors[name]}>
          <InputLabel id={`${name}-label`}>{label}</InputLabel>
          <Select
            labelId={`${name}-label`}
            label={label}
            value={field.value}
            onChange={(e) => {
              const selectedName = e.target.value;
              field.onChange(selectedName);
              onchange(e);
            }}
          >
            {options.map((option, index) => (
              <MenuItem key={`${name}-${index}`} value={option.name}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );
}
