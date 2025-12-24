import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { specialFieldSchema } from "./specialFieldSchema";

const defaultValues = {
  name: "",
  datatypeId: "",
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Failed to save special field";

export function useSpecialFieldForm() {
  const form = useForm({
    defaultValues,
    resolver: yupResolver(specialFieldSchema),
  });
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    (handler) =>
      form.handleSubmit(async (values) => {
        setServerError(null);
        setIsSubmitting(true);
        try {
          await handler({
            ...values,
            datatypeId: Number(values.datatypeId),
          });
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
    (field) => {
      form.reset(
        field
          ? {
              name: field.name || "",
              datatypeId: field.datatypeId || "",
            }
          : defaultValues
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

export default useSpecialFieldForm;
