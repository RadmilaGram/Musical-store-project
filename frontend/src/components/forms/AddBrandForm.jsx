import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Button, Stack, TextField, Typography } from "@mui/material";

import { addBrand_schema } from "../../utils/yupSchemas/AdminSchemas";
import { addBrand } from "../../utils/apiService/ApiService";
import { useBrands } from "../../hooks/useBrands";
import { Item } from "../Item";

function AddBrandForm() {
  const { brands, fetchBrands } = useBrands();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      brandName: "",
    },
    resolver: yupResolver(addBrand_schema),
  });
  const submitFn = handleSubmit(async (data) => {
    console.log(data);
    await addBrand(data);
    await fetchBrands();
    reset();
  });

  return (
    <>
      <form onSubmit={submitFn}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="brandName"
            render={({ field }) => (
              <TextField
                label="Brand name"
                {...field}
                error={!!errors?.brandName}
                helperText={errors?.brandName?.message}
              />
            )}
          />
          <Button variant="contained" color="primary" type="submit">
            Add
          </Button>
        </Stack>
      </form>
      <Typography variant="h4" component="h4" sx={{ mt: "30px" }}>
        Brands:
      </Typography>

      <Stack spacing={2}>
        {brands &&
          brands.map((item) => (
            <Item value={item.id} key={item.id}>
              {item.name}
            </Item>
          ))}
      </Stack>
    </>
  );
}

export default AddBrandForm;
