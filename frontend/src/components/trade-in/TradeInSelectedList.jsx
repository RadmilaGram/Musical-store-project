import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import TradeInSelectedItemCard from "./TradeInSelectedItemCard";

export default function TradeInSelectedList({
  items,
  onRemove,
  onIncrement,
  onDecrement,
  resolveAssetUrl,
  onImageError,
}) {
  return (
    <Box>
      <Typography variant="h6">Selected trade-in items</Typography>
      {items.length > 0 ? (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {items.map((item) => {
            const rawImage =
              item?.prod?.productImg ??
              item?.prod?.img ??
              item?.productImg ??
              item?.img ??
              null;
            const imageUrl = resolveAssetUrl(rawImage, item);
            return (
              <TradeInSelectedItemCard
                key={item.tradeInKey || item.id}
                item={item}
                imageUrl={imageUrl}
                onImageError={() => onImageError(item)}
                onIncrement={
                  item.tradeInKey ? () => onIncrement(item.tradeInKey) : null
                }
                onDecrement={
                  item.tradeInKey ? () => onDecrement(item.tradeInKey) : null
                }
                onRemove={() => onRemove(item.tradeInKey || item.id)}
              />
            );
          })}
        </Stack>
      ) : (
        <Box sx={{ mt: 1.5, p: 2, bgcolor: "#fafafa", borderRadius: 1 }}>
          <Typography>No trade-in items added yet.</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a product and condition above, then click Add.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
