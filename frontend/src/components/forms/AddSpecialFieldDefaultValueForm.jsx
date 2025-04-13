import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Button, Stack, TextField, Typography } from "@mui/material";

import { addSpecialFieldDefaultValue_schema } from "../../utils/yupSchemas/AdminSchemas";
import { addSpecialFieldValue } from "../../utils/apiService/ApiService";
import { useSpecialFieldWithDefaultValues } from "../../hooks/useSpecialFieldWithDefaultValues";
import { useSpecialFieldValues } from "../../hooks/useSpecialFieldValues";

import { Item } from "../Item";
import SelectField from "../formFields/SelectField";

function AddSpecialFieldDefaultValueForm() {
  const { specialField } = useSpecialFieldWithDefaultValues();
  const { specialFieldValues, fetchSpecialFieldValues } =
    useSpecialFieldValues();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      value: "",
      specialFieldSTR: "",
    },
    resolver: yupResolver(addSpecialFieldDefaultValue_schema),
  });
  const submitFn = handleSubmit(async (data) => {
    // console.log(data);
    await addSpecialFieldValue(data);
    await fetchSpecialFieldValues(data.specialFieldSTR);
    // reset();
  });

  return (
    <>
      <form onSubmit={submitFn}>
        <Stack spacing={2}>
          <SelectField
            control={control}
            name="specialFieldSTR"
            label="Special field"
            options={specialField}
            error={errors?.specialFieldSTR}
            onchange={(e) => fetchSpecialFieldValues(e.target.value)}
          />
          <Controller
            control={control}
            name="value"
            render={({ field }) => (
              <TextField
                label="value"
                {...field}
                error={!!errors?.value}
                helperText={errors?.value?.message}
              />
            )}
          />
          <Button variant="contained" color="primary" type="submit">
            Add
          </Button>
        </Stack>
      </form>
      {specialFieldValues?.length > 0 && (
        <>
          <Typography variant="h4" component="h4" sx={{ mt: "30px" }}>
            Special field values:
          </Typography>

          <Stack spacing={2}>
            {specialFieldValues.map((item) => (
              <Item value={item.value} key={item.field_id + item.value}>
                {item.value}
              </Item>
            ))}
          </Stack>
        </>
      )}
    </>
  );
}

export default AddSpecialFieldDefaultValueForm;
