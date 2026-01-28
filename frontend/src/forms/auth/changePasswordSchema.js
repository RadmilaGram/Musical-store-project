import * as yup from "yup";

const changePasswordSchema = yup.object({
  current_password: yup.string().required("Введите текущий пароль"),
  new_password: yup
    .string()
    .min(6, "Минимум 6 символов")
    .required("Введите новый пароль"),
});

export default changePasswordSchema;
