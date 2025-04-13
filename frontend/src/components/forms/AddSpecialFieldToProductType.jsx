import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Button, Stack, TextField, Typography } from "@mui/material";

import { addSpecialFieldToProductType_schema } from "../../utils/yupSchemas/AdminSchemas";
import { addSpecialFieldToProductType } from "../../utils/apiService/ApiService";
import { useProductTypeSpecialFields } from "../../hooks/useProductTypeSpecialFields";
import { useSpecialField } from "../../hooks/useSpecialField";
import { useProductTypes } from "../../hooks/useProductTypes";

import { Item } from "../Item";
import SelectField from "../formFields/SelectField";

function AddSpecialFieldToProductType() {
  const { types } = useProductTypes();

  const { specialField } = useSpecialField();

  const { productTypeSpecialFields, fetchProductTypeSpecialFields } =
    useProductTypeSpecialFields();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productTypeSF: "",
      specialFieldPT: "",
    },
    resolver: yupResolver(addSpecialFieldToProductType_schema),
  });
  const submitFn = handleSubmit(async (data) => {
    console.log(data);
    await addSpecialFieldToProductType(data);
    await fetchProductTypeSpecialFields(data.productTypeSF);
    // reset();
  });

  return (
    <>
      <form onSubmit={submitFn}>
        <Stack spacing={2}>
          <SelectField
            control={control}
            name="productTypeSF"
            label="Product type"
            options={types}
            error={errors?.productTypeSF}
            onchange={(e) => fetchProductTypeSpecialFields(e.target.value)}
          />
          <SelectField
            control={control}
            name="specialFieldPT"
            label="Special field"
            options={specialField}
            error={errors?.specialFieldPT}
          />
          <Button variant="contained" color="primary" type="submit">
            Add
          </Button>
        </Stack>
      </form>
      {productTypeSpecialFields?.length > 0 && (
        <>
          <Typography variant="h4" component="h4" sx={{ mt: "30px" }}>
            Special field:
          </Typography>

          <Stack spacing={2}>
            {productTypeSpecialFields.map((item, id) => (
              <Item
                value={item.type_name}
                key={item.field_name + item.type_name + id}
              >
                {item.type_name} --- {item.field_name}
              </Item>
            ))}
          </Stack>
        </>
      )}
    </>
  );
}

export default AddSpecialFieldToProductType;
