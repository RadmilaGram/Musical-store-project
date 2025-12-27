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

const productEditorSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  description: yup.string().nullable(),
  img: yup.string().nullable(),
  price: yup
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
    .typeError("Price must be a number")
    .min(0, "Price must be ≥ 0")
    .required("Price is required"),
  brandId: numberSelect("Brand is required"),
  statusId: numberSelect("Status is required"),
  typeId: numberSelect("Product type is required"),
  specialFields: yup.object(),
});

export default productEditorSchema;
