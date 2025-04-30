// src/components/ProductCard.jsx
import React, { useState, useRef, useEffect } from "react";
import { Card, CardMedia, Typography, IconButton, Box } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { API_URL } from "../utils/apiService/ApiService";
import { useCart } from "../hooks/useCart";

export default function ProductCard({ product, showRemove = false }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowed, setIsOverflowed] = useState(false);
  const [maxHeight, setMaxHeight] = useState(0);
  const descRef = useRef(null);
  const { items, add, remove } = useCart();
  const cartItem = items.find((i) => i.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const CLAMP_LINES = 4;
  const imageUrl = product.img
    ? `${API_URL}${product.img}`
    : "/images/default-product.png";

  const specs =
    typeof product.special_fields === "string"
      ? JSON.parse(product.special_fields)
      : product.special_fields || {};

  const fullDesc = product.description || "";

  // Measure overflow for description
  useEffect(() => {
    const el = descRef.current;
    if (el) {
      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight);
      const mh = lineHeight * CLAMP_LINES;
      setMaxHeight(mh);
      setIsOverflowed(el.scrollHeight > mh);
    }
  }, [fullDesc]);

  const statusText = product.status_name
    ? product.status_name[0].toUpperCase() + product.status_name.slice(1)
    : "";

  return (
    <Card
      sx={{
        position: "relative",
        width: 800,
        minHeight: 150,
        bgcolor: "#FFF5F7",
        borderLeft: "4px solid #FF4C7D",
        display: "flex",
        flexDirection: "column",
        p: 2,
      }}
    >
      {/* Top: image + title + special fields */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <CardMedia
          component="img"
          image={imageUrl}
          alt={product.name}
          sx={{
            width: 200,
            height: 200,
            objectFit: "cover",
            borderRadius: 1,
            flexShrink: 0,
          }}
          onError={(e) => (e.target.src = "/images/default-product.png")}
        />
        <Box
          sx={{
            ml: 2,
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" sx={{ color: "#FF4C7D" }}>
            {product.name} —{" "}
            <Box component="span" sx={{ color: "#FF4C7D" }}>
              {product.brand_name}
            </Box>
          </Typography>

          <Box sx={{ mt: 1, columnCount: 2, columnGap: 2 }}>
            {Object.entries(specs).map(([key, val]) => (
              <Typography
                key={key}
                variant="body2"
                sx={{ breakInside: "avoid" }}
              >
                <strong>{key}</strong>:{" "}
                {typeof val === "boolean" ? (val ? "yes" : "no") : val}
              </Typography>
            ))}
          </Box>

          {/* Description under special fields, clamp at CLAMP_LINES lines */}
          <Box
            sx={{
              mt: 1,
              display: "flex",
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            <Typography
              ref={descRef}
              variant="body2"
              color="text.secondary"
              component="div"
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                overflowWrap: "break-word",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: expanded ? "none" : CLAMP_LINES,
                maxHeight: expanded ? "none" : `${maxHeight}px`,
              }}
            >
              <strong>Description:&nbsp;</strong>
              {fullDesc}
            </Typography>
            {isOverflowed && (
              <IconButton size="small" onClick={() => setExpanded((v) => !v)}>
                {expanded ? (
                  <ExpandLessIcon sx={{ color: "#FF4C7D" }} />
                ) : (
                  <ExpandMoreIcon sx={{ color: "#FF4C7D" }} />
                )}
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      {/* Status & Price Top Right */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="body1" color="success.main">
          {statusText}
        </Typography>
        <Typography variant="h6">${product.price.toFixed(2)}</Typography>
      </Box>

      {/* Bottom-right: Total and Cart Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mt: 1,
          gap: 1,
        }}
      >
        {/* Cart Controls */}
        {quantity === 0 ? (
          <IconButton
            aria-label="add to cart"
            sx={{ color: "#FF4C7D" }}
            onClick={() => add({ ...product, quantity: 1 })}
          >
            <ShoppingCartIcon />
          </IconButton>
        ) : (
          <>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              Total: ${(quantity * product.price).toFixed(2)}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "#FF4C7D",
                borderRadius: "999px",
                px: 0.5,
              }}
            >
              <IconButton
                aria-label="decrease"
                onClick={() =>
                  quantity > 1
                    ? add({ ...product, quantity: -1 })
                    : remove(product.id)
                }
                sx={{ color: "#fff" }}
              >
                <RemoveIcon />
              </IconButton>
              <Typography sx={{ color: "#fff" }}>{quantity}</Typography>
              <IconButton
                aria-label="increase"
                onClick={() => add({ ...product, quantity: 1 })}
                sx={{ color: "#fff" }}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </>
        )}
        {showRemove && (
          <IconButton
            aria-label="remove from cart"
            onClick={() => remove(product.id)}
            sx={{
              color: "#FF4C7D",
              bgcolor: "rgba(255,76,125,0.1)",
              borderRadius: "999px",
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
    </Card>
  );
}
