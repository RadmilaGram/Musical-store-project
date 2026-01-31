// src/pages/Cart.jsx
import React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import ProductCard from "../components/ProductCard";
import { placeOrder } from "../utils/apiService/ApiService";
import { useTradeIn } from "../hooks/useTradeIn";
import { useCart } from "../hooks/useCart";
import ProtectedActionButton from "../components/ProtectedActionButton";
import { useSpecialFieldsCatalog } from "../hooks/useSpecialFieldsCatalog";
import { useAuth } from "../hooks/useAuth";
import PageContainer from "../components/ui/PageContainer";
import PageTitle from "../components/ui/PageTitle";

export default function Cart() {
  const { items: cartItems, clear, total: purchaseTotal } = useCart();
  const { items: tradeInItems, reset: resetTradeIn } = useTradeIn();
  const { items: specialFieldsCatalog } = useSpecialFieldsCatalog();
  const { user, token } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [deliveryOpen, setDeliveryOpen] = React.useState(false);
  const [deliveryErrors, setDeliveryErrors] = React.useState({});
  const [delivery, setDelivery] = React.useState({
    contactName: "",
    deliveryPhone: "",
    deliveryAddress: "",
    commentClient: "",
  });
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  const openDeliveryDialog = () => {
    setDelivery((prev) => ({
      contactName:
        prev.contactName ||
        user?.full_name ||
        user?.name ||
        user?.fullName ||
        "",
      deliveryPhone:
        prev.deliveryPhone || user?.phone || user?.phone_number || "",
      deliveryAddress: prev.deliveryAddress || user?.address || "",
      commentClient: prev.commentClient || "",
    }));
    setDeliveryErrors({});
    setDeliveryOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (loading) return;
    const errors = {};
    if (!delivery.deliveryPhone?.trim()) {
      errors.deliveryPhone = "Phone is required";
    }
    if (!delivery.deliveryAddress?.trim()) {
      errors.deliveryAddress = "Address is required";
    }
    if (Object.keys(errors).length > 0) {
      setDeliveryErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const userId = user?.id ?? user?.userId ?? token ?? null;
      const orderPayload = {
        userId,
        items: cartItems.map((item) => ({
          productId: item.id ?? item.productId ?? item.product_id,
          quantity: item.quantity ?? 1,
        })),
        delivery: {
          contactName: delivery.contactName,
          deliveryPhone: delivery.deliveryPhone,
          deliveryAddress: delivery.deliveryAddress,
          commentClient: delivery.commentClient,
        },
        tradeInItems: tradeInItems.map((item) => ({
          productId:
            item.id ??
            item.productId ??
            item.prod?.id ??
            item.prod?.productId ??
            item.product_id,
          conditionCode: item.conditionCode,
          quantity: item.quantity ?? 1,
        })),
      };
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
      setDeliveryOpen(false);
      setSnackbar({
        open: true,
        message: "Заказ принят",
        severity: "success",
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Order placement failed:", err);
      }
      setSnackbar({
        open: true,
        message: "Не удалось оформить заказ",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const isDeliveryValid =
    Boolean(delivery.deliveryPhone?.trim()) &&
    Boolean(delivery.deliveryAddress?.trim());

  return (
    <PageContainer>
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <PageTitle>Cart</PageTitle>

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
              onAuthedClick={openDeliveryDialog}
              isLoading={loading}
              disabled={loading || cartItems.length === 0}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </ProtectedActionButton>
          </Stack>
        )}

        <Dialog
          open={deliveryOpen}
          onClose={() => setDeliveryOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Delivery details</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Contact name"
                value={delivery.contactName}
                onChange={(e) =>
                  setDelivery((prev) => ({
                    ...prev,
                    contactName: e.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Phone"
                value={delivery.deliveryPhone}
                onChange={(e) =>
                  setDelivery((prev) => ({
                    ...prev,
                    deliveryPhone: e.target.value,
                  }))
                }
                error={Boolean(deliveryErrors.deliveryPhone)}
                helperText={deliveryErrors.deliveryPhone}
                required
                fullWidth
              />
              <TextField
                label="Delivery address"
                value={delivery.deliveryAddress}
                onChange={(e) =>
                  setDelivery((prev) => ({
                    ...prev,
                    deliveryAddress: e.target.value,
                  }))
                }
                error={Boolean(deliveryErrors.deliveryAddress)}
                helperText={deliveryErrors.deliveryAddress}
                required
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Comment (optional)"
                value={delivery.commentClient}
                onChange={(e) =>
                  setDelivery((prev) => ({
                    ...prev,
                    commentClient: e.target.value,
                  }))
                }
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeliveryOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handlePlaceOrder}
              disabled={loading || !isDeliveryValid}
              startIcon={
                loading ? <CircularProgress color="inherit" size={16} /> : null
              }
            >
              {loading ? "Submitting..." : "Confirm order"}
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
