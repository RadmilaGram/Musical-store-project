import * as yup from "yup";

const tradeInCatalogCreateSchema = yup.object({
  typeId: yup.string().nullable(),
  brandId: yup.string().nullable(),
  productId: yup.string().required("Product is required"),
  referencePrice: yup
    .number()
    .typeError("Reference price is required")
    .moreThan(0, "Enter a positive number"),
});

export default tradeInCatalogCreateSchema;
