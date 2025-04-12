import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { addProduct_schema } from "../utils/yupSchemas/AdminSchemas";

export const useAddProductForm = () => {
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
    resolver: yupResolver(addProduct_schema),
  });
};
