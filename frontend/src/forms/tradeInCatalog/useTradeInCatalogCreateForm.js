import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import productsApi from "../../api/productsApi";
import tradeInCatalogCreateSchema from "./tradeInCatalogCreateSchema";
import {
  clampPercent,
  calculatePercentCap,
  calculateManualCap,
} from "../../pages/admin/sections/TradeInCatalogSection/create/utils/payoutCap";

const defaultValues = {
  typeId: "",
  brandId: "",
  productId: "",
  referencePrice: "",
};

export function useTradeInCatalogCreateForm({
  products = [],
  existingProductIds = [],
}) {
  const form = useForm({
    defaultValues,
    resolver: yupResolver(tradeInCatalogCreateSchema),
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const typeId = watch("typeId");
  const brandId = watch("brandId");
  const productId = watch("productId");

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pickerOptions, setPickerOptions] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [discountMode, setDiscountMode] = useState("percent");
  const [percentValueState, setPercentValueState] = useState(10);
  const setPercentValue = useCallback(
    (value) => {
      setPercentValueState(clampPercent(Number(value) || 0));
    },
    [setPercentValueState]
  );
  const [manualAmount, setManualAmount] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchValue]);

  const typeOptions = useMemo(() => {
    const set = new Map();
    products.forEach((product) => {
      if (product.typeId && product.typeName) {
        set.set(product.typeId, product.typeName);
      }
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const brandOptions = useMemo(() => {
    const set = new Map();
    products.forEach((product) => {
      if (typeId && Number(product.typeId) !== Number(typeId)) return;
      if (product.brandId && product.brandName) {
        set.set(product.brandId, product.brandName);
      }
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [products, typeId]);

  useEffect(() => {
    if (!brandId) return;
    const exists = brandOptions.some(
      (brand) => String(brand.id) === String(brandId)
    );
    if (!exists) {
      setValue("brandId", "");
    }
  }, [brandOptions, brandId, setValue]);

  useEffect(() => {
    let active = true;
    setPickerLoading(true);
    setPickerError(null);
    productsApi
      .search({
        search: debouncedSearch || undefined,
        typeId: typeId || undefined,
        brandId: brandId || undefined,
        limit: 50,
      })
      .then((data) => {
        if (!active) return;
        const filtered = (data || [])
          .filter((item) => !existingProductIds.includes(item.id))
          .map((item) => ({
            id: item.id,
            label: item.name,
            price:
              item.price === null || typeof item.price === "undefined"
                ? null
                : Number(item.price),
            img: item.img,
            brandName: item.brandName,
            typeName: item.typeName,
            secondary: [item.brandName, item.typeName]
              .filter(Boolean)
              .join(" • "),
          }));
        setPickerOptions(filtered);
      })
      .catch((err) => {
        if (!active) return;
        setPickerOptions([]);
        setPickerError(
          err?.response?.data?.message || err?.message || "Failed to load products"
        );
      })
      .finally(() => {
        if (active) setPickerLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, typeId, brandId, existingProductIds]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product || null);
    setValue("productId", product?.id || "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (product?.price != null) {
      setValue("referencePrice", Number(product.price), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const handleResetFilters = () => {
    setValue("typeId", "");
    setValue("brandId", "");
    setSearchValue("");
    setDebouncedSearch("");
  };

  const handlePercentStep = (delta) => {
    setPercentValueState((prev) => clampPercent((Number(prev) || 0) + delta));
  };

  const referencePriceValue = watch("referencePrice");
  const normalizedReferencePrice = useMemo(() => {
    const num = Number(referencePriceValue);
    return Number.isFinite(num) && num > 0 ? Number(num.toFixed(2)) : null;
  }, [referencePriceValue]);

  const percentCapAmount = useMemo(
    () => calculatePercentCap(normalizedReferencePrice, percentValueState),
    [normalizedReferencePrice, percentValueState]
  );

  const manualCapAmount = useMemo(
    () => calculateManualCap(manualAmount),
    [manualAmount]
  );

  const effectiveCapAmount =
    discountMode === "percent" ? percentCapAmount : manualCapAmount;

  const manualAmountError =
    discountMode === "manual" &&
    manualAmount !== "" &&
    manualCapAmount === null;

  const resetForm = useCallback(() => {
    reset(defaultValues);
    setDiscountMode("percent");
    setPercentValue(10);
    setManualAmount("");
    setSearchValue("");
    setDebouncedSearch("");
    setSelectedProduct(null);
  }, [reset]);

  return {
    form,
    control,
    errors,
    handleSubmit,
    resetForm,
    watch,
    setValue,
    typeId,
    brandId,
    productId,
    typeOptions,
    brandOptions,
    pickerOptions,
    pickerLoading,
    pickerError,
    searchValue,
    setSearchValue,
    handleResetFilters,
    selectedProduct,
    handleProductSelect,
    discountMode,
    setDiscountMode,
    percentValue: percentValueState,
    setPercentValue,
    manualAmount,
    setManualAmount,
    handlePercentStep,
    percentCapAmount,
    manualCapAmount,
    effectiveCapAmount,
    normalizedReferencePrice,
    manualAmountError,
  };
}

export default useTradeInCatalogCreateForm;
