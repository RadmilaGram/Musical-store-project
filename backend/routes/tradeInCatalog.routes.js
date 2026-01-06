const express = require("express");

const DUP_ENTRY_CODE = "ER_DUP_ENTRY";

const success = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const errorResponse = (res, status, message, details) => {
  const payload = { success: false, message };
  if (details) {
    payload.details = details;
  }
  return res.status(status).json(payload);
};

const validateProductId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

const validateMoneyValue = (value, { allowNull = false } = {}) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return allowNull ? null : undefined;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 999999.99) {
    return undefined;
  }
  return Number(num.toFixed(2));
};

const baseSelect = `
  SELECT
    tc.product_id AS productId,
    tc.reference_price AS referencePrice,
    tc.base_discount_amount AS baseDiscountAmount,
    tc.updated_at AS updatedAt,
    p.name AS productName,
    p.img AS productImg,
    b.name AS brandName,
    pt.name AS typeName
  FROM trade_in_catalog tc
  JOIN product p ON p.id = tc.product_id
  LEFT JOIN brand b ON b.id = p.brand
  LEFT JOIN product_type pt ON pt.id = p.type
`;

const listQuery = `${baseSelect} ORDER BY tc.updated_at DESC, tc.product_id DESC`;
const singleQuery = `${baseSelect} WHERE tc.product_id = ?`;

const mapRow = (row) => ({
  productId: row.productId,
  referencePrice:
    row.referencePrice === null || typeof row.referencePrice === "undefined"
      ? null
      : Number(row.referencePrice),
  baseDiscountAmount:
    row.baseDiscountAmount === null ||
    typeof row.baseDiscountAmount === "undefined"
      ? null
      : Number(row.baseDiscountAmount),
  updatedAt: row.updatedAt,
  productName: row.productName,
  productImg: row.productImg,
  brandName: row.brandName,
  typeName: row.typeName,
});

function createTradeInCatalogRouter(db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    db.query(listQuery, (err, rows) => {
      if (err) {
        console.error("Failed to fetch trade-in catalog:", err);
        return errorResponse(
          res,
          500,
          "Failed to fetch trade-in catalog",
          err.message
        );
      }
      const data = (rows || []).map(mapRow);
      return success(res, data);
    });
  });

  router.post("/", (req, res) => {
    const productId = validateProductId(req.body?.productId);
    if (!productId) {
      return errorResponse(res, 400, "Invalid productId");
    }

    const referencePrice = validateMoneyValue(req.body?.referencePrice);
    if (typeof referencePrice === "undefined") {
      return errorResponse(res, 400, "Invalid referencePrice");
    }

    const baseDiscountAmount = validateMoneyValue(
      req.body?.baseDiscountAmount,
      { allowNull: true }
    );
    if (typeof baseDiscountAmount === "undefined") {
      return errorResponse(res, 400, "Invalid baseDiscountAmount");
    }

    db.query(
      "INSERT INTO trade_in_catalog (product_id, reference_price, base_discount_amount) VALUES (?, ?, ?)",
      [productId, referencePrice, baseDiscountAmount],
      (err) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, "Product already in trade-in catalog");
          }
          console.error("Failed to create trade-in catalog entry:", err);
          return errorResponse(
            res,
            500,
            "Failed to create trade-in catalog entry",
            err.message
          );
        }

        db.query(singleQuery, [productId], (selectErr, rows) => {
          if (selectErr) {
            console.error("Failed to fetch created trade-in catalog entry:", selectErr);
            return errorResponse(
              res,
              500,
              "Failed to fetch created entry",
              selectErr.message
            );
          }
          const item = rows[0];
          return success(res, item ? mapRow(item) : null, 201);
        });
      }
    );
  });

  router.put("/:productId", (req, res) => {
    const productId = validateProductId(req.params.productId);
    if (!productId) {
      return errorResponse(res, 400, "Invalid productId");
    }

    const referencePrice = validateMoneyValue(req.body?.referencePrice);
    if (typeof referencePrice === "undefined") {
      return errorResponse(res, 400, "Invalid referencePrice");
    }

    const baseDiscountAmount = validateMoneyValue(
      req.body?.baseDiscountAmount,
      { allowNull: true }
    );
    if (typeof baseDiscountAmount === "undefined") {
      return errorResponse(res, 400, "Invalid baseDiscountAmount");
    }

    db.query(
      "UPDATE trade_in_catalog SET reference_price = ?, base_discount_amount = ? WHERE product_id = ?",
      [referencePrice, baseDiscountAmount, productId],
      (err, result) => {
        if (err) {
          console.error("Failed to update trade-in catalog entry:", err);
          return errorResponse(
            res,
            500,
            "Failed to update trade-in catalog entry",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Trade-in catalog entry not found");
        }

        db.query(singleQuery, [productId], (selectErr, rows) => {
          if (selectErr) {
            console.error("Failed to fetch updated trade-in catalog entry:", selectErr);
            return errorResponse(
              res,
              500,
              "Failed to fetch updated entry",
              selectErr.message
            );
          }
          const item = rows[0];
          return success(res, item ? mapRow(item) : null);
        });
      }
    );
  });

  router.delete("/:productId", (req, res) => {
    const productId = validateProductId(req.params.productId);
    if (!productId) {
      return errorResponse(res, 400, "Invalid productId");
    }

    db.query(
      "DELETE FROM trade_in_catalog WHERE product_id = ?",
      [productId],
      (err, result) => {
        if (err) {
          console.error("Failed to delete trade-in catalog entry:", err);
          return errorResponse(
            res,
            500,
            "Failed to delete trade-in catalog entry",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Trade-in catalog entry not found");
        }
        return success(res, { productId });
      }
    );
  });

  return router;
}

module.exports = createTradeInCatalogRouter;
