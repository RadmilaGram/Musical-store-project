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

const validateName = (name) => {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length ? trimmed : null;
};

const parseIdParam = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    errorResponse(res, 400, "Invalid product type id");
    return null;
  }
  return id;
};

function createProductTypesRouter(db) {
  const router = express.Router();

  const fetchProductTypeById = (id) =>
    new Promise((resolve, reject) => {
      db.query(
        "SELECT id, name FROM product_type WHERE id = ?",
        [id],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows[0] || null);
        }
      );
    });

  router.get("/", (req, res) => {
    db.query(
      "SELECT id, name FROM product_type ORDER BY id DESC",
      (err, results) => {
        if (err) {
          return errorResponse(
            res,
            500,
            "Failed to fetch product types",
            err.message
          );
        }
        return success(res, results);
      }
    );
  });

  router.get("/:id", async (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;
    try {
      const productType = await fetchProductTypeById(id);
      if (!productType) {
        return errorResponse(res, 404, "Product type not found");
      }
      return success(res, productType);
    } catch (err) {
      return errorResponse(
        res,
        500,
        "Failed to fetch product type",
        err.message
      );
    }
  });

  router.post("/", (req, res) => {
    const name = validateName(req.body?.name);
    if (!name) {
      return errorResponse(res, 400, "Name is required");
    }

    db.query(
      "INSERT INTO product_type (name) VALUES (?)",
      [name],
      async (err, result) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(
              res,
              409,
              "Product type name already exists"
            );
          }
          return errorResponse(
            res,
            500,
            "Failed to create product type",
            err.message
          );
        }
        try {
          const productType = await fetchProductTypeById(result.insertId);
          return success(res, productType, 201);
        } catch (fetchError) {
          return errorResponse(
            res,
            500,
            "Failed to fetch created product type",
            fetchError.message
          );
        }
      }
    );
  });

  router.put("/:id", (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    const name = validateName(req.body?.name);
    if (!name) {
      return errorResponse(res, 400, "Name is required");
    }

    db.query(
      "UPDATE product_type SET name = ? WHERE id = ?",
      [name, id],
      async (err, result) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(
              res,
              409,
              "Product type name already exists"
            );
          }
          return errorResponse(
            res,
            500,
            "Failed to update product type",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Product type not found");
        }
        try {
          const productType = await fetchProductTypeById(id);
          return success(res, productType);
        } catch (fetchError) {
          return errorResponse(
            res,
            500,
            "Failed to fetch updated product type",
            fetchError.message
          );
        }
      }
    );
  });

  router.delete("/:id", (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    db.query("DELETE FROM product_type WHERE id = ?", [id], (err, result) => {
      if (err) {
        console.error("Failed to delete product type:", err);
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
          return errorResponse(
            res,
            409,
            "Cannot delete: record is used by other entities"
          );
        }
        return errorResponse(
          res,
          500,
          "Failed to delete product type",
          err.message
        );
      }
      if (result.affectedRows === 0) {
        return errorResponse(res, 404, "Product type not found");
      }
      return success(res, { id });
    });
  });

  return router;
}

module.exports = createProductTypesRouter;
