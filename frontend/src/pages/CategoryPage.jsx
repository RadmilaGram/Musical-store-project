// src/pages/CategoryPage.jsx
import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { categoryGroups } from '../constants/categoryGroups';

export default function CategoryPage() {
  const { groupId } = useParams();
  const { data: products, loading, error } = useProducts();

  const group = categoryGroups.find((g) => g.id === groupId) || { types: [] };
  const availableTypes = group.types;

  const [typeFilter, setTypeFilter] = useState('');

  const filtered = useMemo(
    () =>
      products
        .filter((p) => availableTypes.includes(p.type_name))
        .filter((p) => (typeFilter ? p.type_name === typeFilter : true)),
    [products, availableTypes, typeFilter]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Typography color="error" align="center" sx={{ mt: 5 }}>
        Failed to load products.
      </Typography>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Group Name */}
      <Typography variant="h4" align="center" gutterBottom>
        {groupId.charAt(0).toUpperCase() + groupId.slice(1)}
      </Typography>

      {/* Filter by product type within this category */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <FormControl sx={{ width: 840 }}>
          <InputLabel id="type-filter-label">Filter by Type</InputLabel>
          <Select
            labelId="type-filter-label"
            value={typeFilter}
            label="Filter by Type"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            {availableTypes.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Product cards */}
      <Stack spacing={3} alignItems="center">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {filtered.length === 0 && (
          <Typography variant="h6" color="text.secondary">
            No products found for this filter.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
