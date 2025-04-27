// src/components/ProductCard.jsx
import React, { useState, useMemo } from "react";
import {
  Card,
  CardMedia,
  Typography,
  IconButton,
  Box,
  Collapse,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { API_URL } from "../utils/apiService/ApiService";

export default function ProductCard({ product }) {
  const [expanded, setExpanded] = useState(false);

  // URL изображения
  const imageUrl = product.img
    ? `${API_URL}${product.img}`
    : "/images/default-product.png";

  // Разбор JSON полей
  const rawSpecs =
    typeof product.special_fields === "string"
      ? JSON.parse(product.special_fields)
      : product.special_fields || {};

  // Гарантируем ключ isthereacaseincluded
  const specs = { ...rawSpecs };
  if (!Object.prototype.hasOwnProperty.call(specs, "isthereacaseincluded")) {
    specs.isthereacaseincluded = false;
  }

  // Формат булевых
  const formatValue = (val) =>
    typeof val === "boolean" ? (val ? "yes" : "no") : String(val);

  // Описание (сокращённая и полная версии)
  const fullDesc = product.description || "";
  const summary = useMemo(() => {
    return fullDesc.length > 80
      ? fullDesc.slice(0, 80).trim()
      : fullDesc;
  }, [fullDesc]);
  const isTruncated = fullDesc.length > summary.length;

  // Статус
  const statusText = product.status_name
    ? product.status_name[0].toUpperCase() + product.status_name.slice(1)
    : "";

  return (
    <Card
      sx={{
        position: "relative",
        width: 700,
        minHeight: 250,
        bgcolor: "#FFF5F7",
        borderLeft: "4px solid #FF4C7D",
        display: "flex",
        flexDirection: "column",
        p: 2,
      }}
    >
      {/* Верхняя часть: картинка + заголовок + спецполя в колонки */}
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

        <Box sx={{ ml: 2, flex: 1, overflow: "hidden" }}>
          <Typography variant="h6" sx={{ color: "#FF4C7D" }}>
            {product.name} —{" "}
            <Box component="span" sx={{ color: "#FF4C7D" }}>
              {product.brand_name}
            </Box>
          </Typography>

          <Box
            sx={{
              mt: 1,
              columnCount: 2,
              columnGap: 2,
            }}
          >
            {Object.entries(specs).map(([key, val]) => (
              <Typography key={key} variant="body2" sx={{ breakInside: "avoid" }}>
                <strong>{key}</strong>: {formatValue(val)}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Нижняя часть: описание + разворачивание */}
      <Box sx={{ px: 2, pt: 1 }}>
        {!expanded && (
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Typography
              noWrap
              variant="body2"
              color="text.secondary"
              sx={{ flex: 1, minWidth: 0, overflowWrap: "break-word" }}
            >
              <strong>Description:</strong> {summary}
            </Typography>
            {isTruncated && (
              <IconButton size="small" onClick={() => setExpanded(true)}>
                <ExpandMoreIcon sx={{ color: "#FF4C7D" }} />
              </IconButton>
            )}
          </Box>
        )}

        {isTruncated && expanded && (
          <Collapse in={expanded} unmountOnExit>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                width: "100%",
                mt: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                }}
              >
                <strong>Description:</strong> {fullDesc}
              </Typography>
              <IconButton size="small" onClick={() => setExpanded(false)}>
                <ExpandLessIcon sx={{ color: "#FF4C7D" }} />
              </IconButton>
            </Box>
          </Collapse>
        )}
      </Box>

      {/* Блок статуса, цены и корзины */}
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
        <IconButton aria-label="add to cart" sx={{ color: "#FF4C7D" }}>
          <ShoppingCartIcon />
        </IconButton>
      </Box>
    </Card>
  );
}
