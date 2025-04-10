import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";

import {
  Button,
  Stack,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

import { addBrand_schema } from "../../utils/yupSchemas/AdminSchemas";
import { addBrand, getBrand } from "../../utils/apiService/ApiService";
import { Item } from "../customComponents";

function AddBrandForm() {
  const [data, setData] = useState();

  function readBrands() {
    getBrand().then(setData).catch(console.error);
  }

  useEffect(() => {
    readBrands();
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      brandName: "",
      //   password: "",
      //   email: "",
      //   adult: false,
    },
    resolver: yupResolver(addBrand_schema),
  });
  const submitFn = handleSubmit(async (data) => {
    console.log(data);
    await addBrand(data);
    await readBrands();
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
          {/* <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="password"
              type="password"
              {...field}
              error={!!errors?.password}
              helperText={errors?.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label="email"
              {...field}
              error={!!errors?.email}
              helperText={errors?.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="adult"
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox checked={field.value} onChange={field.onChange} />
              }
              label="adult"
            />
          )}
        /> */}
          <Button variant="contained" color="primary" type="submit">
            Add
          </Button>
        </Stack>
      </form>
      <Typography variant="h4" component="h4" sx={{ mt: "30px" }}>
        Brands:
      </Typography>

      <Stack spacing={2}>
        {data &&
          data.map((item) => (
            <Item value={item.id} key={item.id}>
              {item.name}
            </Item>
          ))}
      </Stack>
    </>
  );
}

export default AddBrandForm;
