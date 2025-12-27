import React from "react";
import {
  Box,
  Button,
  FormHelperText,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import { Controller } from "react-hook-form";
import ProductPicker from "./components/ProductPicker";
import { formatCap } from "./utils/payoutCap";

export default function TradeInCatalogCreateForm({
  control,
  errors,
  onSubmit,
  handleSubmit,
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
  onUseCurrentPrice,
  discountMode,
  onDiscountModeChange,
  percentValue,
  onPercentChange,
  onPercentStep,
  manualAmount,
  manualAmountError,
  onManualAmountChange,
  percentCapAmount,
  manualCapAmount,
  effectiveCapAmount,
  isSubmitting,
}) {
  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <ProductPicker
        typeOptions={typeOptions}
        brandOptions={brandOptions}
        typeId={typeId}
        brandId={brandId}
        onTypeChange={onTypeChange}
        onBrandChange={onBrandChange}
        onResetFilters={onResetFilters}
        pickerOptions={pickerOptions}
        pickerLoading={pickerLoading}
        pickerError={pickerError}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        selectedProduct={selectedProduct}
        onProductSelect={onProductSelect}
      />

      <Controller
        name="referencePrice"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Reference price"
            type="number"
            margin="normal"
            fullWidth
            error={!!errors.referencePrice}
            helperText={errors.referencePrice?.message}
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={onUseCurrentPrice}
                    disabled={!selectedProduct?.price}
                  >
                    <ReplayIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      />

      <Box sx={{ mt: 3 }}>
        <ToggleButtonGroup
          value={discountMode}
          exclusive
          onChange={(event, next) => next && onDiscountModeChange(next)}
          size="small"
          color="primary"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="percent">Percent of reference price</ToggleButton>
          <ToggleButton value="manual">Manual amount</ToggleButton>
        </ToggleButtonGroup>

        {discountMode === "percent" && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Button
                variant="outlined"
                size="small"
                onClick={() => onPercentStep(-10)}
                sx={{ height: 56, minWidth: 56, alignSelf: "flex-start" }}
              >
                -10%
              </Button>
              <TextField
                label="Percent"
                type="number"
                value={percentValue}
                onChange={(event) => onPercentChange(event.target.value)}
                inputProps={{ min: 0, max: 100, step: 1 }}
                sx={{ width: 160 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => onPercentStep(10)}
                sx={{ height: 56, minWidth: 56, alignSelf: "flex-start" }}
              >
                +10%
              </Button>
            </Stack>
            <FormHelperText>0–100% of reference price</FormHelperText>
            <FormHelperText>
              Reference price × percent = payout cap. Adjust reference price to
              fine-tune base discount.
            </FormHelperText>
            <FormHelperText>Payout cap: {formatCap(percentCapAmount)}</FormHelperText>
          </Stack>
        )}

        {discountMode === "manual" && (
          <Stack spacing={1}>
            <TextField
              label="Payout cap amount ($)"
              type="number"
              value={manualAmount}
              onChange={(event) => onManualAmountChange(event.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
              error={manualAmountError}
              helperText={
                manualAmountError
                  ? "Enter a non-negative number"
                  : undefined
              }
            />
            <FormHelperText>
              Sets the max payout directly. Payout cap:{" "}
              {formatCap(manualCapAmount)}
            </FormHelperText>
          </Stack>
        )}
      </Box>

      <Button
        sx={{ mt: 3 }}
        variant="contained"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
      <FormHelperText sx={{ mt: 1 }}>
        Final payout = cap × condition percent (configured in Trade-in Conditions).
      </FormHelperText>
      <FormHelperText>Ideal condition cap: {formatCap(effectiveCapAmount)}</FormHelperText>
    </Box>
  );
}
