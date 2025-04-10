import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";

import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

import { Textarea } from "@mui/joy";

import { addProduct_schema } from "../../utils/yupSchemas/AdminSchemas";
import {
  getBrand,
  getProdType,
  getProdSatus,
  addProduct,
} from "../../utils/apiService/ApiService";
import { Item } from "../customComponents";

function AddProductForm() {
  const [brands, setBrands] = useState();
  const [types, setTypes] = useState();
  const [statuses, setStatuses] = useState();

  function readBrands() {
    getBrand().then(setBrands).catch(console.error);
  }

  function readProdTypes() {
    getProdType().then(setTypes).catch(console.error);
  }

  function readProdStatuses() {
    getProdSatus().then(setStatuses).catch(console.error);
  }

  useEffect(() => {
    readBrands();
    readProdTypes();
    readProdStatuses();
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      img: "",
      price: "",
      brandId: "",
      statusId: "",
      typeId: "",
    },
    resolver: yupResolver(addProduct_schema),
  });
  const submitFn = handleSubmit(async (data) => {
    console.log(data);

    await addProduct(data);
    // await readBrands();
    reset();
  });

  return (
    <>
      <form onSubmit={submitFn}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                label="Name (model)"
                {...field}
                error={!!errors?.name}
                helperText={errors?.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="typeId"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel id="product_product_type_id">Type</InputLabel>
                <Select
                  labelId="product_product_type_id"
                  id="product_product_type_id"
                  // value={typeId}
                  label="Type"
                  // onChange={handleChange}
                  {...field}
                  error={!!errors?.typeId}
                >
                  {types &&
                    types.map((item) => (
                      <MenuItem value={item.id} key={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="brandId"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel id="product_brand_id">Brand</InputLabel>
                <Select
                  labelId="product_brand_id"
                  id="product_brand_id"
                  // value={brandId}
                  label="Brand"
                  // onChange={handleChange}
                  {...field}
                  error={!!errors?.brandId}
                >
                  {brands &&
                    brands.map((item) => (
                      <MenuItem value={item.id} key={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="statusId"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel id="product_brand_id">Status</InputLabel>
                <Select
                  labelId="product_brand_id"
                  id="product_brand_id"
                  // value={statusId}
                  label="Brand"
                  // onChange={handleChange}
                  {...field}
                  error={!!errors?.statusId}
                >
                  {statuses &&
                    statuses.map((item) => (
                      <MenuItem value={item.id} key={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Textarea
                label="description"
                {...field}
                error={!!errors?.description}
                placeholder="Description"
              />
            )}
          />
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <TextField
                label="Price"
                {...field}
                error={!!errors?.price}
                helperText={errors?.price?.message}
                type="number"
              />
            )}
          />
          <Controller
            name="img"
            control={control}
            defaultValue={null}
            render={({ field }) => (
              <Box 
              {...field}>
                <input
                  type="file"
                  accept="image/*"
                  id="product-image"
                  style={{ display: 'none' }} // скрыть оригинальный input
                  onChange={(e) => field.onChange(e.target.files[0])}
                />
                <label htmlFor="product-image">
                  <Button variant="outlined" component="span">
                    Upload Image
                  </Button>
                </label>
                {field.value && (
                  <Typography style={{ marginTop: 8 }}>Selected file: {field.value.name}</Typography>
                )}
                {/* {!field.value && (
                  <Typography style={{ marginTop: 8 }}>Image is required</Typography>
                )} */}
              </Box>
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
          <Button
            variant="contained"
            color="primary"
            type="submit"
          >
            Add
          </Button>
        </Stack>
      </form>
    </>
  );
}

export default AddProductForm;
