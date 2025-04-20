import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { addProduct_schema } from "../utils/yupSchemas/AdminSchemas";

const getDynamicSchema = (specialFields = []) => {
  const dynamicShape = {};

  specialFields.forEach((field) => {
    const safeName = field.field_name.replace(/\s/g, "");

    if (field.field_dt_name === "string") {
      dynamicShape[safeName] = yup.string().required("Required");
    } else if (field.field_dt_name === "boolean") {
      dynamicShape[safeName] = yup.boolean().required("Required");
    } else {
      dynamicShape[safeName] = yup
        .number()
        .typeError("Must be a number")
        .required("Required");
    }
  });

  return yup.object().shape(dynamicShape);
};

export const useAddProductForm = (specialFields = []) => {
  const fullSchema = addProduct_schema.concat(getDynamicSchema(specialFields));

  return useForm({
    defaultValues: {
      name: "",
      description: "",
      img: null,
      price: "",
      brandId: "",
      statusId: "",
      typeId: "",
    },
    resolver: yupResolver(fullSchema),
  });
};
