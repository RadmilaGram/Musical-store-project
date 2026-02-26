import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Button,
  Container,
  Stack,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { useSpecialFieldsCatalog } from "../hooks/useSpecialFieldsCatalog";
import { useCategoryBySlug } from "../hooks/useCategoryBySlug";

export default function CategoryPage() {
  const { slug } = useParams();
  const {
    data: categoryDetails,
    loading: categoryLoading,
    error: categoryError,
  } = useCategoryBySlug(slug);
  const { data: products, loading: productsLoading, error: productsError } =
    useProducts();
  const {
    items: specialFieldsCatalog,
    loading: fieldsLoading,
    error: fieldsError,
  } = useSpecialFieldsCatalog();

  const [typeFilter, setTypeFilter] = useState("");

  const category = categoryDetails?.category || null;
  const types = categoryDetails?.types || [];
  const categoryNotFound =
    Number(categoryError?.response?.status ?? categoryError?.status) === 404;

  const filteredProducts = useMemo(() => {
    const availableTypeIds = new Set(
      (types || []).map((type) => Number(type.id)).filter((id) => id > 0)
    );

    const selectedTypeId = typeFilter ? Number(typeFilter) : null;

    return (products || []).filter((product) => {
      const productTypeId = Number(product.typeId ?? product.type_id ?? 0);
      if (!availableTypeIds.has(productTypeId)) {
        return false;
      }
      if (selectedTypeId && productTypeId !== selectedTypeId) {
        return false;
      }
      return true;
    });
  }, [products, types, typeFilter]);

  if (categoryLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (categoryNotFound || !category) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Stack spacing={2} alignItems="center">
          <Typography color="error" align="center">
            Category not found.
          </Typography>
          <Button component={Link} to="/" variant="contained">
            Back to Home
          </Button>
        </Stack>
      </Container>
    );
  }

  if (categoryError) {
    return (
      <Typography color="error" align="center" sx={{ mt: 5 }}>
        Failed to load category.
      </Typography>
    );
  }

  if (productsLoading || fieldsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (productsError || fieldsError) {
    return (
      <Typography color="error" align="center" sx={{ mt: 5 }}>
        Failed to load products.
      </Typography>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" align="center" gutterBottom>
        {category.name}
      </Typography>

      {types.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <Button
              variant={typeFilter === "" ? "contained" : "outlined"}
              onClick={() => setTypeFilter("")}
            >
              All Types
            </Button>
            {types.map((type) => (
              <Button
                key={type.id}
                variant={String(type.id) === typeFilter ? "contained" : "outlined"}
                onClick={() => setTypeFilter(String(type.id))}
              >
                {type.name}
              </Button>
            ))}
          </Stack>
        </Box>
      )}

      <Stack spacing={3} alignItems="center">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            specialFieldsCatalog={specialFieldsCatalog}
          />
        ))}
        {filteredProducts.length === 0 && (
          <Typography variant="h6" color="text.secondary">
            No products found for this filter.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
