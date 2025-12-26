import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { tradeInConditionSchema } from "./tradeInConditionSchema";

const defaultValues = {
  code: "",
  percent: "",
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Failed to save trade-in condition";

export function useTradeInConditionForm({ isEdit = false } = {}) {
  const form = useForm({
    defaultValues,
    resolver: yupResolver(
      isEdit
        ? tradeInConditionSchema.shape({
            code: tradeInConditionSchema.fields.code.notRequired(),
          })
        : tradeInConditionSchema
    ),
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
    (condition) => {
      form.reset(
        condition
          ? {
              code: condition.code || "",
              percent:
                condition.percent === null ||
                typeof condition.percent === "undefined"
                  ? ""
                  : Number(condition.percent),
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

export default useTradeInConditionForm;
