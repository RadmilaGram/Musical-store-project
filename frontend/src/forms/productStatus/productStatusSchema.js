import * as yup from "yup";

export const productStatusSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(1, "Name is required")
    .max(45, "Name must be at most 45 characters")
    .required("Name is required"),
});

export default productStatusSchema;
