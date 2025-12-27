import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import productEditorSchema from "./productEditorSchema";
import productTypeSpecialFieldsApi from "../../api/productTypeSpecialFieldsApi";
import specialFieldValuesApi from "../../api/specialFieldValuesApi";
import {
  normalizeSpecialFieldsForInitial,
  parseSpecialFieldsRaw,
  buildSpecialFieldsPayload,
} from "../../pages/admin/sections/ProductsSection/utils/specialFieldsAdapter";

const defaultValues = {
  name: "",
  description: "",
  img: "",
  price: "",
  brandId: "",
  statusId: "",
  typeId: "",
  specialFields: {},
};

export function useProductEditorForm({
  product,
  specialFieldsCatalog,
  productStatuses,
}) {
  const form = useForm({
    defaultValues,
    resolver: yupResolver(productEditorSchema),
  });

  const {
    watch,
    setValue,
    reset,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const [assignedFields, setAssignedFields] = useState([]);
  const [specialFieldValues, setSpecialFieldValues] = useState({});
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedLoaded, setAssignedLoaded] = useState(false);

  const initializedKeyRef = useRef(null);

  const typeId = watch("typeId");

  const getBaseValues = useCallback(
    (target) => ({
      ...defaultValues,
      name: target?.name ?? "",
      description: target?.description ?? "",
      img: target?.img ?? "",
      price: target?.price ?? "",
      brandId: Number(target?.brandId ?? target?.brand_id ?? "") || "",
      statusId: (() => {
        const rawId =
          target?.statusId ?? target?.status_id ?? target?.status ?? "";
        if (rawId !== "" && rawId != null) {
          return String(rawId);
        }
        const name =
          target?.statusName ?? target?.status_name ?? target?.statusName ?? "";
        if (!name) return "";
        const matched = (productStatuses || []).find(
          (status) => status?.name === name
        );
        return matched ? String(matched.id) : "";
      })(),
      typeId: Number(target?.typeId ?? target?.type_id ?? "") || "",
      specialFields: {},
    }),
    [productStatuses]
  );

  useEffect(() => {
    if (!product || !product.id) {
      reset(defaultValues);
      initializedKeyRef.current = null;
      return;
    }
    reset(getBaseValues(product));
    initializedKeyRef.current = null;
  }, [product, reset, getBaseValues]);

  useEffect(() => {
    if (!typeId) {
      setAssignedFields([]);
      setSpecialFieldValues({});
      return;
    }
    let active = true;
    setAssignedLoading(true);
    productTypeSpecialFieldsApi
      .listByType(typeId)
      .then((fields) => {
        if (!active) return;
        setAssignedFields(fields || []);
        const fieldIds = (fields || []).map((field) => field.id);
        if (!fieldIds.length) {
          setSpecialFieldValues({});
          return;
        }
        return specialFieldValuesApi
          .listBatch(fieldIds)
          .then((map) => {
            if (!active) return;
            setSpecialFieldValues(map || {});
          })
          .catch(() => {
            if (!active) return;
            setSpecialFieldValues({});
          });
      })
      .catch(() => {
        if (!active) return;
        setAssignedFields([]);
        setSpecialFieldValues({});
      })
      .finally(() => {
        if (active) {
          setAssignedLoading(false);
          setAssignedLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [typeId]);

  useEffect(() => {
    const optionsKey = Object.keys(specialFieldValues || {}).length;
    const key = [product?.id, typeId, assignedFields.length, optionsKey].join(
      ":"
    );
    if (
      !product ||
      !product.id ||
      !typeId ||
      !assignedLoaded ||
      assignedFields.length === 0 ||
      initializedKeyRef.current === key
    ) {
      return;
    }
    const rawSpecial = parseSpecialFieldsRaw(product.specialFieldsRaw);
    const normalizedSpecial = normalizeSpecialFieldsForInitial(
      rawSpecial,
      assignedFields,
      specialFieldsCatalog
    );
    assignedFields.forEach((field) => {
      const fieldId = String(field.id);
      const options =
        specialFieldValues?.[fieldId] || specialFieldValues?.[field.id] || [];
      if (options.length && normalizedSpecial[fieldId] != null) {
        normalizedSpecial[fieldId] = String(normalizedSpecial[fieldId]);
      }
    });
    initializedKeyRef.current = key;
    reset(
      {
        ...getBaseValues(product),
        specialFields: normalizedSpecial,
      },
      { keepDirty: false }
    );
  }, [
    product,
    typeId,
    assignedFields,
    assignedLoaded,
    specialFieldValues,
    specialFieldsCatalog,
    reset,
    getBaseValues,
  ]);

  const buildPayload = useCallback(
    (values) => ({
      ...values,
      specialFields: buildSpecialFieldsPayload(
        values.specialFields,
        assignedFields
      ),
    }),
    [assignedFields]
  );

  const resetForm = useCallback(() => {
    reset(defaultValues);
    setAssignedFields([]);
    setSpecialFieldValues({});
    setAssignedLoaded(false);
    initializedKeyRef.current = null;
  }, [reset]);

  return {
    form,
    control,
    errors,
    handleSubmit,
    assignedFields,
    assignedLoading,
    specialFieldValues,
    setValue,
    watch,
    typeId,
    buildPayload,
    resetForm,
  };
}

export default useProductEditorForm;
