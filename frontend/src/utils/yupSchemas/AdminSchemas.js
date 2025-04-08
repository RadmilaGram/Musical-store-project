import * as yup from "yup";

export const addBrand_schema = yup.object().shape({
  brandName: yup.string().min(2, "less than 2 words").required(),
  //   password: yup
  //     .string()
  //     .min(6, "less than 6 words")
  //     .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, "invalid syntax")
  //     .required(),
  //   email: yup.string().email(),
  //   adult: yup.boolean(),
});

export const addProdType_schema = yup.object().shape({
  productTypeName: yup.string().min(2, "less than 2 words").required(),
});
