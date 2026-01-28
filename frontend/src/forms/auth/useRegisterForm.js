import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import registerSchema from "./registerSchema";

export function useRegisterForm() {
  const form = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    },
  });
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword((prev) => !prev);

  return {
    ...form,
    showPassword,
    togglePassword,
  };
}

export default useRegisterForm;
