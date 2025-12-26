import * as yup from "yup";

export const tradeInConditionSchema = yup.object().shape({
  code: yup
    .string()
    .trim()
    .min(1, "Code is required")
    .max(32, "Code must be at most 32 characters")
    .required("Code is required"),
  percent: yup
    .number()
    .typeError("Percent must be a number")
    .min(0, "Percent must be ≥ 0")
    .max(1000, "Percent must be ≤ 1000")
    .required("Percent is required"),
});

export default tradeInConditionSchema;
