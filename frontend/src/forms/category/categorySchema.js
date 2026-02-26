import * as yup from "yup";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categorySchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .max(45, "Maximum 45 characters")
    .required("Name is required"),
  slug: yup
    .string()
    .transform((value) =>
      typeof value === "string" ? value.trim().toLowerCase() : value
    )
    .max(64, "Maximum 64 characters")
    .matches(slugPattern, "Use lowercase letters, numbers and hyphens")
    .required("Slug is required"),
  img: yup
    .string()
    .nullable()
    .transform((value) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }),
  sort_order: yup
    .number()
    .transform((value, originalValue) => {
      if (
        originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return 0;
      }
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? NaN : parsed;
    })
    .integer("Sort order must be an integer")
    .required("Sort order is required")
    .default(0),
  is_active: yup
    .number()
    .transform((value, originalValue) => {
      if (
        originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return 1;
      }
      const parsed = Number(originalValue);
      return Number.isNaN(parsed) ? NaN : parsed;
    })
    .oneOf([0, 1], "is_active must be 0 or 1")
    .required("is_active is required")
    .default(1),
});

export default categorySchema;
