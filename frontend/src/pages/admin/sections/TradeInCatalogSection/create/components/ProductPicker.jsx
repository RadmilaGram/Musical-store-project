import React from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { API_URL } from "../../../../../../utils/apiService/ApiService";

export default function ProductPicker({
  typeOptions,
  brandOptions,
  typeId,
  brandId,
  onTypeChange,
  onBrandChange,
  onResetFilters,
  pickerOptions,
  pickerLoading,
  pickerError,
  searchValue,
  onSearchChange,
  selectedProduct,
  onProductSelect,
}) {
  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
        <TextField
          select
          label="Product type"
          value={typeId}
          onChange={(event) => onTypeChange(event.target.value)}
          fullWidth
          helperText="Filter products by type"
        >
          <MenuItem value="">All types</MenuItem>
          {typeOptions.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Brand"
          value={brandId}
          onChange={(event) => onBrandChange(event.target.value)}
          fullWidth
          helperText="Brand options adjust by selected type"
          disabled={!brandOptions.length}
        >
          <MenuItem value="">All brands</MenuItem>
          {brandOptions.map((brand) => (
            <MenuItem key={brand.id} value={brand.id}>
              {brand.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button onClick={onResetFilters} size="small">
          Reset filters
        </Button>
      </Box>
      <Autocomplete
        options={pickerOptions}
        loading={pickerLoading}
        value={selectedProduct}
        onChange={(event, newValue) => onProductSelect(newValue)}
        inputValue={searchValue}
        onInputChange={(event, value) => onSearchChange(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Product"
            margin="normal"
            helperText={pickerError || "Search by name, filter by type/brand"}
            error={Boolean(pickerError)}
          />
        )}
        getOptionLabel={(option) => option?.label || ""}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <div>
              <div>{option.label}</div>
              {option.secondary && (
                <small style={{ color: "#666" }}>{option.secondary}</small>
              )}
            </div>
          </li>
        )}
      />
      {selectedProduct && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 2,
            alignItems: "center",
          }}
        >
          {selectedProduct.img && (
            <Box
              component="img"
              src={
                selectedProduct.img.startsWith("http")
                  ? selectedProduct.img
                  : `${API_URL}${selectedProduct.img}`
              }
              alt={selectedProduct.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              sx={{
                width: 72,
                height: 72,
                borderRadius: 1,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2">
              {selectedProduct.label || selectedProduct.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[selectedProduct.brandName, selectedProduct.typeName]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
            {selectedProduct.price != null && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Current price: ${Number(selectedProduct.price).toFixed(2)}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      {pickerError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {pickerError}
        </Alert>
      )}
    </>
  );
}
