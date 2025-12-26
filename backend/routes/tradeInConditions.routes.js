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

const validateCode = (code) => {
  if (typeof code !== "string") return null;
  const trimmed = code.trim();
  if (!trimmed || trimmed.length > 32) {
    return null;
  }
  return trimmed;
};

const validatePercent = (value) => {
  if (value === null || typeof value === "undefined") return null;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0 || num > 1000) {
    return null;
  }
  return num;
};

const parseCodeParam = (req, res) => {
  const code = validateCode(req.params.code);
  if (!code) {
    errorResponse(res, 400, "Invalid code");
    return null;
  }
  return code;
};

function createTradeInConditionsRouter(db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    db.query(
      "SELECT code, percent FROM trade_in_conditions ORDER BY code ASC",
      (err, rows) => {
        if (err) {
          console.error("Failed to fetch trade-in conditions:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch trade-in conditions",
            err.message
          );
        }
        return success(res, rows);
      }
    );
  });

  router.get("/:code", (req, res) => {
    const code = parseCodeParam(req, res);
    if (!code) return;

    db.query(
      "SELECT code, percent FROM trade_in_conditions WHERE code = ?",
      [code],
      (err, rows) => {
        if (err) {
          console.error("Failed to fetch trade-in condition:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch trade-in condition",
            err.message
          );
        }
        const item = rows[0];
        if (!item) {
          return errorResponse(res, 404, "Trade-in condition not found");
        }
        return success(res, item);
      }
    );
  });

  router.post("/", (req, res) => {
    const code = validateCode(req.body?.code);
    const percent = validatePercent(req.body?.percent);

    if (!code) {
      return errorResponse(res, 400, "Code is required");
    }
    if (percent === null) {
      return errorResponse(res, 400, "Percent must be between 0 and 1000");
    }

    db.query(
      "INSERT INTO trade_in_conditions (code, percent) VALUES (?, ?)",
      [code, percent],
      (err) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, "Condition already exists");
          }
          console.error("Failed to create trade-in condition:", err);
          return errorResponse(
            res,
            500,
            "Failed to create trade-in condition",
            err.message
          );
        }
        return success(res, { code, percent }, 201);
      }
    );
  });

  router.put("/:code", (req, res) => {
    const code = parseCodeParam(req, res);
    if (!code) return;

    const percent = validatePercent(req.body?.percent);
    if (percent === null) {
      return errorResponse(res, 400, "Percent must be between 0 and 1000");
    }

    db.query(
      "UPDATE trade_in_conditions SET percent = ? WHERE code = ?",
      [percent, code],
      (err, result) => {
        if (err) {
          console.error("Failed to update trade-in condition:", err);
          return errorResponse(
            res,
            500,
            "Failed to update trade-in condition",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Trade-in condition not found");
        }
        return success(res, { code, percent });
      }
    );
  });

  router.delete("/:code", (req, res) => {
    const code = parseCodeParam(req, res);
    if (!code) return;

    db.query(
      "DELETE FROM trade_in_conditions WHERE code = ?",
      [code],
      (err, result) => {
        if (err) {
          console.error("Failed to delete trade-in condition:", err);
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
            "Failed to delete trade-in condition",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Trade-in condition not found");
        }
        return success(res, { code });
      }
    );
  });

  return router;
}

module.exports = createTradeInConditionsRouter;
