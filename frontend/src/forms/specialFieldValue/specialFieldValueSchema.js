import * as yup from "yup";

export const specialFieldValueSchema = yup.object().shape({
  value: yup.string().trim().required("Value is required"),
});

export default specialFieldValueSchema;
