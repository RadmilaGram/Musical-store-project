import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { specialFieldValueSchema } from "./specialFieldValueSchema";

const defaultValues = {
  value: "",
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Failed to save value";

export function useSpecialFieldValueForm() {
  const form = useForm({
    defaultValues,
    resolver: yupResolver(specialFieldValueSchema),
  });
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    (handler) =>
      form.handleSubmit(async (values) => {
        setServerError(null);
        setIsSubmitting(true);
        try {
          await handler(values.value.trim());
        } catch (error) {
          setServerError(getErrorMessage(error));
          throw error;
        } finally {
          setIsSubmitting(false);
        }
      }),
    [form]
  );

  const resetToDefault = useCallback(
    (value) => {
      form.reset({ value: value || "" });
      setServerError(null);
    },
    [form]
  );

  return {
    form,
    onSubmit,
    serverError,
    setServerError,
    isSubmitting,
    resetToDefault,
  };
}

export default useSpecialFieldValueForm;
