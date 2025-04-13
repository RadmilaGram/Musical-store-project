import * as yup from "yup";

export const addBrand_schema = yup.object().shape({
  brandName: yup.string().min(2, "less than 2 words").required(),
});

export const addProdType_schema = yup.object().shape({
  productTypeName: yup.string().min(2, "less than 2 words").required(),
});

export const addProduct_schema = yup.object().shape({
  name: yup.string().min(2, "less than 2 words").required(),
  description: yup.string().required(),
  price: yup
    .number()
    .test("is-decimal", "invalid decimal", (value) => value > 0),
  brandId: yup.number().required(),
  statusId: yup.number().required(),
  typeId: yup.number().required(),
  img: yup
    .mixed()
    .required("Image is required")
    .test("fileExists", "Image is required", (value) => !!value),
});

export const addSpecialField_schema = yup.object().shape({
    specialFieldName: yup.string().min(2, "less than 2 words").required(),
    specialFieldDT: yup.number().required(),
  });
