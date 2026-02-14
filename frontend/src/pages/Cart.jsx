// src/pages/Cart.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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

const deliverySchema = yup.object({
  contactName: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .required("Contact name is required")
    .min(2, "Contact name must be at least 2 characters")
    .max(100, "Contact name must be at most 100 characters"),
  deliveryPhone: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .required("Phone is required")
    .min(7, "Phone must be at least 7 characters")
    .max(30, "Phone must be at most 30 characters"),
  deliveryAddress: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .required("Delivery address is required")
    .min(5, "Delivery address must be at least 5 characters")
    .max(200, "Delivery address must be at most 200 characters"),
  commentClient: yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .max(500, "Comment must be at most 500 characters"),
});

export default function Cart() {
  const { items: cartItems, clear, total: purchaseTotal } = useCart();
  const { items: tradeInItems, reset: resetTradeIn } = useTradeIn();
  const { items: specialFieldsCatalog } = useSpecialFieldsCatalog();
  const { user, token } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [deliveryOpen, setDeliveryOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    resolver: yupResolver(deliverySchema),
    defaultValues: {
      contactName: "",
      deliveryPhone: "",
      deliveryAddress: "",
      commentClient: "",
    },
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
    reset({
      contactName:
        user?.full_name ||
        user?.name ||
        user?.fullName ||
        "",
      deliveryPhone:
        user?.phone || user?.phone_number || "",
      deliveryAddress: user?.address || "",
      commentClient: "",
    });
    setDeliveryOpen(true);
  };

  const handleCloseDeliveryDialog = () => {
    setDeliveryOpen(false);
    reset({
      contactName: "",
      deliveryPhone: "",
      deliveryAddress: "",
      commentClient: "",
    });
  };

  const handlePlaceOrder = async (values) => {
    if (loading) return;
    const deliveryValues = {
      contactName: values.contactName.trim(),
      deliveryPhone: values.deliveryPhone.trim(),
      deliveryAddress: values.deliveryAddress.trim(),
      commentClient: (values.commentClient || "").trim(),
    };

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
          contactName: deliveryValues.contactName,
          deliveryPhone: deliveryValues.deliveryPhone,
          deliveryAddress: deliveryValues.deliveryAddress,
          commentClient: deliveryValues.commentClient,
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
      handleCloseDeliveryDialog();
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
          onClose={handleCloseDeliveryDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Delivery details</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Contact name"
                {...register("contactName")}
                error={Boolean(errors.contactName)}
                helperText={errors.contactName?.message}
                fullWidth
              />
              <TextField
                label="Phone"
                {...register("deliveryPhone")}
                error={Boolean(errors.deliveryPhone)}
                helperText={errors.deliveryPhone?.message}
                required
                fullWidth
              />
              <TextField
                label="Delivery address"
                {...register("deliveryAddress")}
                error={Boolean(errors.deliveryAddress)}
                helperText={errors.deliveryAddress?.message}
                required
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Comment (optional)"
                {...register("commentClient")}
                error={Boolean(errors.commentClient)}
                helperText={errors.commentClient?.message}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeliveryDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit(handlePlaceOrder)}
              disabled={loading}
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
