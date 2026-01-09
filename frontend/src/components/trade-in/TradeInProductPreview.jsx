import React from "react";
import { Box, Card, Stack, Typography } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import { API_URL } from "../../utils/apiService/ApiService";
import { normalizeSpecialFieldsForDisplay } from "../../utils/specialFields/normalizeSpecialFieldsForDisplay";

export default function TradeInProductPreview({
  catalogEntry,
  condition,
  offer,
  productDetails,
  specialFieldsCatalog,
  isSpecialFieldsLoading,
  isLoading,
}) {
  if (!catalogEntry) return null;

  const imageUrl = productDetails?.img ? `${API_URL}${productDetails.img}` : null;
  const conditionLabel = condition ? condition.code : null;
  const discountValue = offer?.discount ?? 0;
  const rawSpecialFields =
    productDetails?.specialFieldsRaw ??
    productDetails?.special_fields_raw ??
    productDetails?.special_fields ??
    productDetails?.special_filds ??
    productDetails?.specialFields ??
    null;
  let normalizedRaw = rawSpecialFields;
  if (typeof rawSpecialFields === "string") {
    const trimmed = rawSpecialFields.trim();
    if (trimmed) {
      try {
        normalizedRaw = JSON.parse(trimmed);
      } catch {
        normalizedRaw = null;
      }
    } else {
      normalizedRaw = null;
    }
  }
  const canNormalize =
    Array.isArray(specialFieldsCatalog) && normalizedRaw !== null;
  const specialFields = canNormalize
    ? normalizeSpecialFieldsForDisplay(normalizedRaw, specialFieldsCatalog)
    : [];

  return (
    <Card sx={{ p: 2, bgcolor: "#f7f9fc" }}>
      <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={catalogEntry.name}
            sx={{
              width: 168,
              height: 168,
              objectFit: "contain",
              borderRadius: 1,
              bgcolor: "#fff",
            }}
            onError={(e) => (e.currentTarget.src = "/images/default-product.jpg")}
          />
        ) : (
          <Box
            sx={{
              width: 168,
              height: 168,
              borderRadius: 1,
              bgcolor: "#e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageIcon sx={{ color: "#9e9e9e" }} />
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {catalogEntry.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[catalogEntry.brand_name, catalogEntry.type_name]
              .filter(Boolean)
              .join(" • ")}
          </Typography>

          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {productDetails && (
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Special fields
                </Typography>
                {isSpecialFieldsLoading ? (
                  <Typography variant="caption" color="text.secondary">
                    Loading special fields…
                  </Typography>
                ) : specialFields.length > 0 ? (
                  <Box>
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      {specialFields.slice(0, 6).map((field) => (
                        <Typography key={field.id} variant="body2">
                          {field.name}: {String(field.value ?? "—")}
                        </Typography>
                      ))}
                    </Stack>
                    {specialFields.length > 6 && (
                      <Typography variant="caption" color="text.secondary">
                        +{specialFields.length - 6} more
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No special fields for this product
                  </Typography>
                )}
              </Box>
            )}

            {isLoading ? (
              <Typography variant="body2" color="text.secondary">
                Loading details…
              </Typography>
            ) : (
              productDetails?.description && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Description
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {productDetails.description}
                  </Typography>
                </Box>
              )
            )}
            
            <Box sx={{ p: 1.5, bgcolor: "#fff", borderRadius: 1 }}>
              <Typography variant="subtitle2">Offer</Typography>
              {condition ? (
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                  <Typography variant="body2">
                    Condition: {conditionLabel}
                  </Typography>
                  <Typography variant="body2">
                    Discount: ${discountValue}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select condition to see discount
                </Typography>
              )}
            </Box>

          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
