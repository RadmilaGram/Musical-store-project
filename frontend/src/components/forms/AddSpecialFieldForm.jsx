import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Button, Stack, TextField, Typography } from "@mui/material";

import { addSpecialField_schema } from "../../utils/yupSchemas/AdminSchemas";
import { addSpecialField } from "../../utils/apiService/ApiService";
import { useSpecialFieldDT } from "../../hooks/useSpecialFieldDT";
import { useSpecialField } from "../../hooks/useSpecialField";

import { Item } from "../Item";
import SelectField from "../formFields/SelectField";

function AddSpecialFieldForm() {
  const { specialFieldDT } = useSpecialFieldDT();
  const { specialField, fetchSpecialField } = useSpecialField();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      specialFieldName: "",
      specialFieldDT: "",
    },
    resolver: yupResolver(addSpecialField_schema),
  });
  const submitFn = handleSubmit(async (data) => {
    console.log(data);
    await addSpecialField(data);
    await fetchSpecialField();
    reset();
  });

  return (
    <>
      <form onSubmit={submitFn}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="specialFieldName"
            render={({ field }) => (
              <TextField
                label="Special field name"
                {...field}
                error={!!errors?.specialFieldName}
                helperText={errors?.specialFieldName?.message}
              />
            )}
          />

          <SelectField
            control={control}
            name="specialFieldDT"
            label="Type"
            options={specialFieldDT}
            error={errors?.specialFieldDT}
          />
          <Button variant="contained" color="primary" type="submit">
            Add
          </Button>
        </Stack>
      </form>
      {specialField.length > 0 && (
        <>
          <Typography variant="h4" component="h4" sx={{ mt: "30px" }}>
            Special fields:
          </Typography>

          <Stack spacing={2}>
            {specialField.map((item) => (
              <Item value={item.id} key={item.id}>
                {item.name}
              </Item>
            ))}
          </Stack>
        </>
      )}
    </>
  );
}

export default AddSpecialFieldForm;
