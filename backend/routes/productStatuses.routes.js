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
  if (!trimmed || trimmed.length > 45) {
    return null;
  }
  return trimmed;
};

const parseIdParam = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    errorResponse(res, 400, "Invalid status id");
    return null;
  }
  return id;
};

function createProductStatusesRouter(db) {
  const router = express.Router();

  const fetchStatusById = (id) =>
    new Promise((resolve, reject) => {
      db.query(
        "SELECT id, name FROM product_status WHERE id = ?",
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
      "SELECT id, name FROM product_status ORDER BY id ASC",
      (err, results) => {
        if (err) {
          console.error("Failed to fetch product statuses:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch product statuses",
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
      const statusRow = await fetchStatusById(id);
      if (!statusRow) {
        return errorResponse(res, 404, "Status not found");
      }
      return success(res, statusRow);
    } catch (err) {
      console.error("Failed to fetch product status:", err);
      return errorResponse(
        res,
        500,
        "Failed to fetch product status",
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
      "INSERT INTO product_status (name) VALUES (?)",
      [name],
      async (err, result) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, "Status already exists");
          }
          console.error("Failed to create product status:", err);
          return errorResponse(
            res,
            500,
            "Failed to create product status",
            err.message
          );
        }
        try {
          const statusRow = await fetchStatusById(result.insertId);
          return success(res, statusRow, 201);
        } catch (fetchError) {
          console.error("Failed to fetch created product status:", fetchError);
          return errorResponse(
            res,
            500,
            "Failed to fetch created product status",
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
      "UPDATE product_status SET name = ? WHERE id = ?",
      [name, id],
      async (err, result) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, "Status already exists");
          }
          console.error("Failed to update product status:", err);
          return errorResponse(
            res,
            500,
            "Failed to update product status",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Status not found");
        }
        try {
          const statusRow = await fetchStatusById(id);
          return success(res, statusRow);
        } catch (fetchError) {
          console.error("Failed to fetch updated product status:", fetchError);
          return errorResponse(
            res,
            500,
            "Failed to fetch updated product status",
            fetchError.message
          );
        }
      }
    );
  });

  router.delete("/:id", (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    db.query(
      "DELETE FROM product_status WHERE id = ?",
      [id],
      (err, result) => {
        if (err) {
          console.error("Failed to delete product status:", err);
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
            "Failed to delete product status",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Status not found");
        }
        return success(res, { id });
      }
    );
  });

  return router;
}

module.exports = createProductStatusesRouter;
