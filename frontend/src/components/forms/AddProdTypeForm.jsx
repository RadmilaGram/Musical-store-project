import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Button, Stack, TextField, Typography } from "@mui/material";

import { useProductTypes } from "../../hooks/useProductTypes";
import { addProdType_schema } from "../../utils/yupSchemas/AdminSchemas";
import { addProdType } from "../../utils/apiService/ApiService";
import { Item } from "../customComponents";

function AddProdTypeForm() {
  const { types, fetchProdType } = useProductTypes();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productTypeName: "",
    },
    resolver: yupResolver(addProdType_schema),
  });
  const submitFn = handleSubmit(async (data) => {
    console.log(data);
    await addProdType(data);
    await fetchProdType();
    reset();
  });

  return (
    <>
      <form onSubmit={submitFn}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="productTypeName"
            render={({ field }) => (
              <TextField
                label="Product type name"
                {...field}
                error={!!errors?.productTypeName}
                helperText={errors?.productTypeName?.message}
              />
            )}
          />
          <Button variant="contained" color="primary" type="submit">
            Add
          </Button>
        </Stack>
      </form>
      <Typography variant="h4" component="h4" sx={{ mt: "30px" }}>
        Product types:
      </Typography>

      <Stack spacing={2}>
        {types &&
          types.map((item) => (
            <Item value={item.id} key={item.id}>
              {item.name}
            </Item>
          ))}
      </Stack>
    </>
  );
}

export default AddProdTypeForm;
