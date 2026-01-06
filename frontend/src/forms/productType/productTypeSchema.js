import * as yup from "yup";

export const productTypeSchema = yup.object().shape({
  name: yup.string().trim().min(2, "Minimum 2 characters").required("Required"),
});

export default productTypeSchema;
