import * as yup from "yup";

export const brandSchema = yup.object().shape({
  name: yup.string().trim().min(2, "Minimum 2 characters").required("Required"),
});

export default brandSchema;
