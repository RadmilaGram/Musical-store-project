// src/pages/CategoryPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { Container, Typography, Stack } from "@mui/material";
import { useProducts } from "../hooks/useProducts";
import { categoryGroups } from "../constants/categoryGroups";
import ProductCard from "../components/ProductCard";

export default function CategoryPage() {
  const { groupId } = useParams();
  const group = categoryGroups.find((g) => g.id === groupId);
  const { data: products = [], loading, error } = useProducts();

  if (!group) {
    return (
      <Container sx={{ py: 5 }}>
        <Typography variant="h5" color="error" align="center">
          Category not found
        </Typography>
      </Container>
    );
  }
  if (loading) {
    return (
      <Container sx={{ py: 5 }}>
        <Typography align="center">Loading products…</Typography>
      </Container>
    );
  }
  if (error) {
    return (
      <Container sx={{ py: 5 }}>
        <Typography align="center" color="error">
          Error loading products
        </Typography>
      </Container>
    );
  }

  const normalize = (s) => s.trim().toLowerCase();
  const allowed = group.types.map(normalize);
  const filtered = products.filter((p) =>
    allowed.includes(normalize(p.type_name))
  );

  return (
    <Container sx={{ py: 5 }}>
      <Typography variant="h4" align="center" gutterBottom>
        {group.title}
      </Typography>

      {filtered.length === 0 ? (
        <Typography align="center" sx={{ mt: 3 }}>
          No products to display
        </Typography>
      ) : (
        <Stack spacing={3}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Stack>
      )}
    </Container>
  );
}
