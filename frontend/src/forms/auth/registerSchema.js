import * as yup from "yup";

const registerSchema = yup.object({
  full_name: yup.string().required("Укажите имя"),
  email: yup.string().email("Неверный email").required("Укажите email"),
  phone: yup.string().required("Укажите телефон"),
  address: yup.string().required("Укажите адрес"),
  password: yup
    .string()
    .min(6, "Минимум 6 символов")
    .required("Введите пароль"),
});

export default registerSchema;
