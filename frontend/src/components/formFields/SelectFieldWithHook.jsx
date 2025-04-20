import React, { useEffect } from "react";
import { Controller } from "react-hook-form";
import { InputLabel, FormControl, Select, MenuItem } from "@mui/material";
import SelectField from "../../components/formFields/SelectField";
import { useSpecialFieldValues } from "../../hooks/useSpecialFieldValues";

function getOptions(inOptions) {
  let result = [];
  for (let item in inOptions) {
    result.push({ id: inOptions[item].field_id, name: inOptions[item].value });
  }
  return result;
}

function SelectFieldWithHook({
  control,
  errors,
  name,
  label,
  id,
  onchange = () => {},
}) {
  const { specialFieldValues, fetchSpecialFieldValues } =
    useSpecialFieldValues();

  useEffect(() => {
    fetchSpecialFieldValues(id);
  }, []);


  return (
    <>
      {specialFieldValues.length > 0 && (
        <SelectField
          control={control}
          name={name}
          label={label}
          options={getOptions(specialFieldValues)}
          error={errors[name]}
          onchange={onchange}
        />
      )}
    </>
  );
}

export default SelectFieldWithHook;
