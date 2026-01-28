import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import changePasswordSchema from "./changePasswordSchema";

export function useChangePasswordForm() {
  const form = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
    },
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  return {
    ...form,
    showCurrent,
    showNext,
    toggleCurrent: () => setShowCurrent((prev) => !prev),
    toggleNext: () => setShowNext((prev) => !prev),
  };
}

export default useChangePasswordForm;
