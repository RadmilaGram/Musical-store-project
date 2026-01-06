const express = require("express");

const DUP_ENTRY_CODE = "ER_DUP_ENTRY";
const FK_CONSTRAINT_CODE = "ER_ROW_IS_REFERENCED_2";

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

const parseNumericParam = (
  req,
  res,
  paramName = "id",
  label = "product type id"
) => {
  const value = Number(req.params[paramName]);
  if (!Number.isInteger(value) || value <= 0) {
    errorResponse(res, 400, `Invalid ${label}`);
    return null;
  }
  return value;
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
    const id = parseNumericParam(req, res);
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
    const id = parseNumericParam(req, res);
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
    const id = parseNumericParam(req, res);
    if (!id) return;

    db.query("DELETE FROM product_type WHERE id = ?", [id], (err, result) => {
      if (err) {
        console.error("Failed to delete product type:", err);
        if (err.code === FK_CONSTRAINT_CODE) {
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

  router.get("/:typeId/special-fields", (req, res) => {
    const typeId = parseNumericParam(req, res, "typeId", "typeId");
    if (!typeId) return;

    db.query(
      `SELECT sf.id, sf.name, sf.datatype AS datatypeId, dt.name AS datatypeName
       FROM product_type_special_field ptsf
       JOIN special_field sf ON sf.id = ptsf.spec_fild_id
       LEFT JOIN special_field_datatype dt ON dt.id = sf.datatype
       WHERE ptsf.type_id = ?
       ORDER BY sf.id DESC`,
      [typeId],
      (err, results) => {
        if (err) {
          console.error("Failed to fetch special fields for type:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch special fields for product type",
            err.message
          );
        }
        return success(res, results);
      }
    );
  });

  router.get("/:typeId/special-field-assignments", (req, res) => {
    const typeId = parseNumericParam(req, res, "typeId", "typeId");
    if (!typeId) return;

    db.query(
      "SELECT spec_fild_id FROM product_type_special_field WHERE type_id = ?",
      [typeId],
      (err, results) => {
        if (err) {
          console.error("Failed to load special field assignments:", err);
          return errorResponse(
            res,
            500,
            "Failed to load special field assignments",
            err.message
          );
        }
        const assignedFieldIds = results.map((row) => row.spec_fild_id);
        return success(res, { assignedFieldIds });
      }
    );
  });

  router.put("/:typeId/special-field-assignments", (req, res) => {
    const typeId = parseNumericParam(req, res, "typeId", "typeId");
    if (!typeId) return;

    const fieldIds = Array.isArray(req.body?.fieldIds)
      ? req.body.fieldIds
      : null;

    if (!fieldIds) {
      return errorResponse(res, 400, "fieldIds must be an array");
    }

    const normalized = fieldIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (fieldIds.length !== normalized.length) {
      return errorResponse(res, 400, "fieldIds must contain valid IDs");
    }

    db.beginTransaction((startErr) => {
      if (startErr) {
        console.error("Failed to start transaction:", startErr);
        return errorResponse(
          res,
          500,
          "Failed to save assignments",
          startErr.message
        );
      }

      const rollback = (err) => {
        db.rollback(() => {
          if (err) {
            console.error("Failed to save assignments:", err);
            if (err.code === FK_CONSTRAINT_CODE) {
              errorResponse(res, 409, "Invalid fieldIds");
            } else {
              errorResponse(
                res,
                500,
                "Failed to save assignments",
                err.message
              );
            }
          }
        });
      };

      db.query(
        "DELETE FROM product_type_special_field WHERE type_id = ?",
        [typeId],
        (deleteErr) => {
          if (deleteErr) {
            rollback(deleteErr);
            return;
          }

          if (!normalized.length) {
            return db.commit((commitErr) => {
              if (commitErr) {
                rollback(commitErr);
                return;
              }
              return success(res, { assignedFieldIds: [] });
            });
          }

          const values = normalized.map((fieldId) => [typeId, fieldId]);
          db.query(
            "INSERT INTO product_type_special_field (type_id, spec_fild_id) VALUES ?",
            [values],
            (insertErr) => {
              if (insertErr) {
                rollback(insertErr);
                return;
              }
              db.commit((commitErr) => {
                if (commitErr) {
                  rollback(commitErr);
                  return;
                }
                return success(res, { assignedFieldIds: normalized });
              });
            }
          );
        }
      );
    });
  });

  return router;
}

module.exports = createProductTypesRouter;
