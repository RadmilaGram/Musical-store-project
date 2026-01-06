import * as yup from "yup";

export const specialFieldSchema = yup.object().shape({
  name: yup.string().trim().min(2, "Minimum 2 characters").required("Required"),
  datatypeId: yup
    .number()
    .typeError("Datatype is required")
    .required("Datatype is required"),
});

export default specialFieldSchema;
