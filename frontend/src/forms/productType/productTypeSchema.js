import * as yup from "yup";

const numberSelect = (label) =>
  yup
    .number()
    .transform((value, originalValue) => {
      if (
        originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return NaN;
      }
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? NaN : parsed;
    })
    .typeError(label)
    .required(label);

export const productTypeSchema = yup.object().shape({
  name: yup.string().trim().min(2, "Minimum 2 characters").required("Required"),
  categoryId: numberSelect("Category is required"),
});

export default productTypeSchema;
