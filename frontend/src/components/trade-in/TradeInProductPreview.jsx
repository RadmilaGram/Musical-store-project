import React, { useState } from "react";
import { Box, Card, Paper, Stack, Typography } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import { API_URL } from "../../utils/apiService/ApiService";
import { normalizeSpecialFieldsForDisplay } from "../../utils/specialFields/normalizeSpecialFieldsForDisplay";
import ImagePreviewDialog from "../ui/ImagePreviewDialog";

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
  const [isImageOpen, setImageOpen] = useState(false);
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
    <Stack spacing={2}>
      <Card sx={{ p: 2, bgcolor: "#f7f9fc" }}>
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
        {imageUrl ? (
          <Box
            sx={{
              width: 168,
              height: 168,
              bgcolor: "#fff",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
              flexShrink: 0,
              position: "relative",
              cursor: "pointer",
              transition: "transform 0.2s",
              "&:after": {
                content: '""',
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.12)",
                opacity: 0,
                transition: "opacity 0.2s",
                pointerEvents: "none",
              },
              "&:hover": {
                transform: "scale(1.02)",
              },
              "&:hover:after": {
                opacity: 1,
              },
            }}
            onClick={() => setImageOpen(true)}
          >
            <Box
              component="img"
              src={imageUrl}
              alt={catalogEntry.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
              onError={(e) =>
                (e.currentTarget.src = "/images/default-product.jpg")
              }
            />
          </Box>
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
            
          </Stack>
        </Box>
        </Stack>
        {imageUrl && (
          <ImagePreviewDialog
            open={isImageOpen}
            src={imageUrl}
            alt={catalogEntry.name}
            onClose={() => setImageOpen(false)}
          />
        )}
      </Card>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          transition: "box-shadow 0.2s ease",
          "&:hover": { boxShadow: 4 },
        }}
      >
        <Typography variant="subtitle2">Offer</Typography>
        {condition ? (
          <Box
            sx={{
              mt: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Condition: {conditionLabel}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Discount:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                ${discountValue}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select condition to see discount
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}
