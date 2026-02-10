const express = require("express");
const createRequireAuth = require("../middlewares/requireAuth");

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
    tc.id,
    tc.product_id AS productId,
    tc.reference_price AS referencePrice,
    tc.base_discount_amount AS baseDiscountAmount,
    tc.is_active AS isActive,
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

const listQuery = `${baseSelect} WHERE tc.is_active = 1 ORDER BY tc.updated_at DESC, tc.product_id DESC`;
const singleQuery = `${baseSelect} WHERE tc.id = ?`;

const mapRow = (row) => ({
  id: row.id,
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
  isActive: row.isActive === null || typeof row.isActive === "undefined"
    ? null
    : Number(row.isActive),
  updatedAt: row.updatedAt,
  productName: row.productName,
  productImg: row.productImg,
  brandName: row.brandName,
  typeName: row.typeName,
});

function createTradeInCatalogRouter(db) {
  const router = express.Router();
  const requireAuth = createRequireAuth(db);

  const requireAdmin = (req, res) => {
    const role = Number(req.user?.role);
    if (role !== 1) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return false;
    }
    return true;
  };

  const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

  const begin = () =>
    new Promise((resolve, reject) => {
      db.beginTransaction((err) => (err ? reject(err) : resolve()));
    });

  const rollback = () =>
    new Promise((resolve) => {
      db.rollback(() => resolve());
    });

  const commit = () =>
    new Promise((resolve, reject) => {
      db.commit((err) => {
        if (err) {
          return db.rollback(() => reject(err));
        }
        resolve();
      });
    });

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

  router.get("/admin/offers", requireAuth, (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const productId = validateProductId(req.query?.product_id);
    if (req.query?.product_id !== undefined && !productId) {
      return errorResponse(res, 400, "Invalid product_id");
    }

    const rawActive = req.query?.is_active;
    const isActive =
      rawActive === undefined || rawActive === null || rawActive === ""
        ? null
        : Number(rawActive);
    if (isActive !== null && ![0, 1].includes(isActive)) {
      return errorResponse(res, 400, "Invalid is_active");
    }

    const clauses = [];
    const params = [];
    if (productId) {
      clauses.push("tc.product_id = ?");
      params.push(productId);
    }
    if (isActive !== null) {
      clauses.push("tc.is_active = ?");
      params.push(isActive);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const sql = `${baseSelect} ${where} ORDER BY tc.updated_at DESC, tc.id DESC`;

    db.query(sql, params, (err, rows) => {
      if (err) {
        console.error("Failed to fetch trade-in offers:", err);
        return errorResponse(res, 500, "Failed to fetch trade-in offers", err.message);
      }
      return success(res, (rows || []).map(mapRow));
    });
  });

  router.post("/admin/offers", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const productId = validateProductId(req.body?.product_id);
    if (!productId) {
      return errorResponse(res, 400, "Invalid product_id");
    }

    const referencePrice = validateMoneyValue(req.body?.reference_price);
    if (typeof referencePrice === "undefined") {
      return errorResponse(res, 400, "Invalid reference_price");
    }

    const baseDiscountAmount = validateMoneyValue(
      req.body?.base_discount_amount,
      { allowNull: true }
    );
    if (typeof baseDiscountAmount === "undefined") {
      return errorResponse(res, 400, "Invalid base_discount_amount");
    }

    const rawActive = req.body?.is_active;
    const isActive = rawActive === undefined ? 1 : Number(rawActive);
    if (![0, 1].includes(isActive)) {
      return errorResponse(res, 400, "Invalid is_active");
    }

    try {
      await begin();

      if (isActive === 1) {
        await query(
          "UPDATE trade_in_catalog SET is_active = 0 WHERE product_id = ? AND is_active = 1",
          [productId]
        );
      }

      const result = await query(
        "INSERT INTO trade_in_catalog (product_id, reference_price, base_discount_amount, is_active) VALUES (?, ?, ?, ?)",
        [productId, referencePrice, baseDiscountAmount, isActive]
      );

      const insertId = result.insertId;
      const rows = await query(singleQuery, [insertId]);

      await commit();
      return success(res, rows[0] ? mapRow(rows[0]) : null, 201);
    } catch (err) {
      await rollback();
      console.error("Failed to create trade-in offer:", err);
      return errorResponse(res, 500, "Failed to create trade-in offer", err.message);
    }
  });

  router.patch("/admin/offers/:id/active", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const offerId = Number(req.params.id);
    if (!Number.isInteger(offerId) || offerId <= 0) {
      return errorResponse(res, 400, "Invalid id");
    }

    const isActive = Number(req.body?.is_active);
    if (![0, 1].includes(isActive)) {
      return errorResponse(res, 400, "Invalid is_active");
    }

    try {
      await begin();

      const rows = await query(
        "SELECT id, product_id FROM trade_in_catalog WHERE id = ? FOR UPDATE",
        [offerId]
      );
      const offer = rows[0];
      if (!offer) {
        await rollback();
        return errorResponse(res, 404, "Offer not found");
      }

      if (isActive === 1) {
        await query(
          "UPDATE trade_in_catalog SET is_active = 0 WHERE product_id = ? AND id <> ? AND is_active = 1",
          [offer.product_id, offerId]
        );
      }

      await query("UPDATE trade_in_catalog SET is_active = ? WHERE id = ?", [
        isActive,
        offerId,
      ]);

      const updated = await query(singleQuery, [offerId]);
      await commit();
      return success(res, updated[0] ? mapRow(updated[0]) : null);
    } catch (err) {
      await rollback();
      console.error("Failed to update trade-in offer:", err);
      return errorResponse(res, 500, "Failed to update trade-in offer", err.message);
    }
  });

  router.delete("/admin/offers/:id", requireAuth, (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const offerId = Number(req.params.id);
    if (!Number.isInteger(offerId) || offerId <= 0) {
      return errorResponse(res, 400, "Invalid id");
    }

    db.query(
      "DELETE FROM trade_in_catalog WHERE id = ?",
      [offerId],
      (err, result) => {
        if (err) {
          console.error("Failed to delete trade-in offer:", err);
          return errorResponse(
            res,
            500,
            "Failed to delete trade-in offer",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Trade-in offer not found");
        }
        return success(res, { id: offerId });
      }
    );
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
      "INSERT INTO trade_in_catalog (product_id, reference_price, base_discount_amount, is_active) VALUES (?, ?, ?, 1)",
      [productId, referencePrice, baseDiscountAmount],
      (err, result) => {
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

        const insertId = result.insertId;
        db.query(singleQuery, [insertId], (selectErr, rows) => {
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
      "UPDATE trade_in_catalog SET reference_price = ?, base_discount_amount = ? WHERE product_id = ? AND is_active = 1",
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

        db.query(
          `${baseSelect} WHERE tc.product_id = ? AND tc.is_active = 1 ORDER BY tc.updated_at DESC, tc.id DESC LIMIT 1`,
          [productId],
          (selectErr, rows) => {
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
        }
        );
      }
    );
  });

  router.delete("/:productId", (req, res) => {
    const productId = validateProductId(req.params.productId);
    if (!productId) {
      return errorResponse(res, 400, "Invalid productId");
    }

    db.query(
      "DELETE FROM trade_in_catalog WHERE product_id = ? AND is_active = 1",
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
