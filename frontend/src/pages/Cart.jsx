// src/pages/Cart.jsx
import React from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import ProductCard from "../components/ProductCard";
import { placeOrder } from "../utils/apiService/ApiService";
import { useTradeIn } from "../hooks/useTradeIn";
import { useCart } from "../hooks/useCart";
import ProtectedActionButton from "../components/ProtectedActionButton";
import { useSpecialFieldsCatalog } from "../hooks/useSpecialFieldsCatalog";

export default function Cart() {
  const { items: cartItems, clear, total: purchaseTotal } = useCart();
  const { items: tradeInItems, reset: resetTradeIn } = useTradeIn();
  const { items: specialFieldsCatalog } = useSpecialFieldsCatalog();
  const [loading, setLoading] = React.useState(false);

  // Sum of all trade-in item discounts (per unit * trade-in quantity)
  const totalDiscount = tradeInItems.reduce((sum, item) => {
    const qty = Number(item.quantity ?? 1) || 1;
    const unitDiscount = Number(item.expectedDiscount) || 0;
    return sum + unitDiscount * qty;
  }, 0);

  // Cap discount at 50% of purchaseTotal
  const maxAllowedDiscount = purchaseTotal / 2;
  const effectiveDiscount = Math.min(totalDiscount, maxAllowedDiscount);

  // Unused portion if discount exceeds half the price
  const unusedDiscount =
    totalDiscount > maxAllowedDiscount ? totalDiscount - maxAllowedDiscount : 0;

  // Final price after applying effective discount
  const finalPrice = purchaseTotal - effectiveDiscount;

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderPayload = { items: cartItems };
      const res = await placeOrder(orderPayload);
      const payload = res?.data ?? res;
      const success =
        payload?.success === true ||
        Boolean(payload?.id ?? payload?.orderId ?? payload?.data?.id);
      if (!success) {
        throw new Error("Order placement failed");
      }
      clear();
      resetTradeIn();
      alert("Order placed (stub)!");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Order placement failed (stub):", err);
      }
      alert("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h5" mb={2} align="center">
        Cart
      </Typography>

      {cartItems.length === 0 ? (
        <Typography>Your cart is empty.</Typography>
      ) : (
        <Stack spacing={2} alignItems="center">
          {/* Cart Items as ProductCard */}
          {cartItems.map((item) => {
            return (
              <Box
                key={item.id}
                sx={{ position: "relative", display: "inline-block", mb: 4 }}
              >
                <ProductCard
                  showRemove={true}
                  product={item}
                  specialFieldsCatalog={specialFieldsCatalog}
                />
              </Box>
            );
          })}

          {/* Trade-In Summary (replaces Total) */}
          {tradeInItems.length > 0 ? (
            <Box
              sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
              align="right"
              width="100%"
            >
              <Stack spacing={1} sx={{ textAlign: "right" }}>
                <Typography color="text.primary">
                  Price: ${purchaseTotal.toFixed(2)}
                </Typography>
                <Typography color="success.main">
                  Discount: -${effectiveDiscount.toFixed(2)}
                </Typography>
                {unusedDiscount > 0 && (
                  <Typography color="error">
                    Unused Discount: ${unusedDiscount.toFixed(2)}
                  </Typography>
                )}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "1.25rem",
                    color: "success.main",
                  }}
                >
                  Final Price: ${finalPrice.toFixed(2)}
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{ display: "flex", justifyContent: "flex-end" }}
              align="right"
              width="100%"
            >
              <Typography variant="h6">
                Total: ${purchaseTotal.toFixed(2)}
              </Typography>
            </Box>
          )}

          <ProtectedActionButton
            onAuthedClick={handlePlaceOrder}
            isLoading={loading}
          >
            {loading ? "Placing Order..." : "Place Order"}
          </ProtectedActionButton>
        </Stack>
      )}
    </Box>
  );
}
