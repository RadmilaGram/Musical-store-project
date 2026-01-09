import React from "react";
import {
  Box,
  Card,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveIcon from "@mui/icons-material/Remove";

export default function TradeInSelectedItemCard({
  item,
  imageUrl,
  onRemove,
  onImageError,
  onIncrement,
  onDecrement,
}) {
  const subtitle = [item.brand_name, item.type_name].filter(Boolean).join(" • ");
  const quantity = item.quantity ?? 1;
  const totalDiscount = Number(item.expectedDiscount) * quantity;

  return (
    <Card sx={{ p: 1.5 }}>
      <Stack
        spacing={2}
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ minWidth: 0 }}
        >
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={item.name}
              sx={{
                width: 64,
                height: 64,
                objectFit: "contain",
                borderRadius: 1,
                bgcolor: "#f5f5f5",
              }}
              onError={onImageError}
            />
          ) : (
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 1,
                bgcolor: "#e0e0e0",
              }}
            />
          )}

          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={600} noWrap>
              {item.name}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            )}
            <Typography
              variant="body2"
              fontWeight={600}
              color="text.primary"
              sx={{ mt: 0.25 }}
            >
              Condition: {item.conditionCode}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent={{ xs: "flex-start", sm: "flex-end" }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "flex-end",
              gap: 1,
              minWidth: 140,
            }}
          >
            
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ visibility: quantity > 1 ? "visible" : "hidden" }}
            >
              ${item.expectedDiscount} each
            </Typography>
            <Typography variant="h6">${totalDiscount}</Typography>
          </Box>
          {onIncrement && onDecrement ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "primary.main",
                borderRadius: "999px",
                px: 0.5,
              }}
            >
              <IconButton
                aria-label="decrease quantity"
                onClick={onDecrement}
                sx={{ color: "common.white" }}
              >
                <RemoveIcon fontSize="inherit" />
              </IconButton>
              <Typography
                variant="body2"
                sx={{ color: "common.white" }}
              >
                {quantity}
              </Typography>
              <IconButton
                aria-label="increase quantity"
                onClick={onIncrement}
                sx={{ color: "common.white" }}
              >
                <AddIcon fontSize="inherit" />
              </IconButton>
            </Box>
          ) : (
            <Typography variant="body2">×{quantity}</Typography>
          )}
          <IconButton
            onClick={onRemove}
            aria-label="remove trade-in item"
            color="primary"
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
}
