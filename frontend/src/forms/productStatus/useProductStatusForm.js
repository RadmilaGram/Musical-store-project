import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { productStatusSchema } from "./productStatusSchema";

const defaultValues = {
  name: "",
};

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Failed to save status";

export function useProductStatusForm() {
  const form = useForm({
    defaultValues,
    resolver: yupResolver(productStatusSchema),
  });
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    (handler) =>
      form.handleSubmit(async (values) => {
        setServerError(null);
        setIsSubmitting(true);
        try {
          await handler(values);
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
    (status) => {
      form.reset(
        status
          ? {
              name: status.name || "",
            }
          : defaultValues,
        { keepDirty: false }
      );
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

export default useProductStatusForm;
