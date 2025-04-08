import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Button,
  Stack,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

import { addProdType_schema } from "../../utils/yupSchemas/AdminSchemas";
import { addProdType, getProdType } from "../../utils/apiService/ApiService";
import { Item } from "../customComponents";

function AddProdTypeForm() {
  const [data, setData] = useState();

  function getData() {
    let result = [];
    for (const item in data) {
      result.push(data[item]["name"].toString());
    }
    // console.log(result);

    result.sort();

    return (
      <Stack spacing={2}>
        {result.map((element) => {
          return <Item key={element}>{element}</Item>;
        })}
      </Stack>
    );
  }

  function readProdTypes() {
    getProdType().then(setData).catch(console.error);
  }

  useEffect(() => {
    readProdTypes();
  }, []);

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
    await readProdTypes();
    reset();
  });

  return (
    <>
      <form onSubmit={submitFn}>
        <Typography variant="h4" component="h4">
          Adding product types
        </Typography>

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
      {getData()}
    </>
  );
}

export default AddProdTypeForm;
