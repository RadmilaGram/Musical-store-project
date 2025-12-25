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

const normalizeString = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};


const validateDatatypeId = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const parseNumericParam = (req, res, paramName, label) => {
  const raw = req.params[paramName];
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    errorResponse(res, 400, `Invalid ${label}`);
    return null;
  }
  return value;
};

function createSpecialFieldsRouter(db) {
  const router = express.Router();

  router.get("/values", (req, res) => {
    const raw = req.query.fieldIds;
    if (!raw) {
      return errorResponse(res, 400, "fieldIds query parameter is required");
    }

    const ids = Array.from(
      new Set(
        String(raw)
          .split(",")
          .map((part) => Number(part))
          .filter((num) => Number.isInteger(num) && num > 0)
      )
    );

    if (!ids.length) {
      return success(res, {});
    }

    const placeholders = ids.map(() => "?").join(",");
    db.query(
      `SELECT field_id AS fieldId, value
       FROM special_field_values
       WHERE field_id IN (${placeholders})
       ORDER BY field_id, value`,
      ids,
      (err, results) => {
        if (err) {
          console.error("Failed to fetch special field values:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch field values",
            err.message
          );
        }

        const grouped = results.reduce((acc, row) => {
          const key = String(row.fieldId);
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(row.value);
          return acc;
        }, {});

        return success(res, grouped);
      }
    );
  });

  const fetchDatatypeById = (datatypeId) =>
    new Promise((resolve, reject) => {
      db.query(
        "SELECT id, name FROM special_field_datatype WHERE id = ?",
        [datatypeId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows[0] || null);
        }
      );
    });

  const fetchFieldById = (id) =>
    new Promise((resolve, reject) => {
      db.query(
        `SELECT sf.id, sf.name, sf.datatype AS datatypeId, dt.name AS datatypeName
         FROM special_field sf
         LEFT JOIN special_field_datatype dt ON dt.id = sf.datatype
         WHERE sf.id = ?`,
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
      `SELECT sf.id, sf.name, sf.datatype AS datatypeId, dt.name AS datatypeName
       FROM special_field sf
       LEFT JOIN special_field_datatype dt ON dt.id = sf.datatype
       ORDER BY sf.id DESC`,
      (err, results) => {
        if (err) {
          console.error("Failed to fetch special fields:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch special fields",
            err.message
          );
        }
        return success(res, results);
      }
    );
  });

  router.get("/:id", async (req, res) => {
    const id = parseNumericParam(req, res, "id", "special field id");
    if (!id) return;
    try {
      const field = await fetchFieldById(id);
      if (!field) {
        return errorResponse(res, 404, "Special field not found");
      }
      return success(res, field);
    } catch (err) {
      console.error("Failed to fetch special field:", err);
      return errorResponse(
        res,
        500,
        "Failed to fetch special field",
        err.message
      );
    }
  });

  router.post("/", async (req, res) => {
    const name = normalizeString(req.body?.name);
    const datatypeId = validateDatatypeId(req.body?.datatypeId);

    if (!name) {
      return errorResponse(res, 400, "Name is required");
    }
    if (!datatypeId) {
      return errorResponse(res, 400, "datatypeId is required");
    }

    try {
      const datatype = await fetchDatatypeById(datatypeId);
      if (!datatype) {
        return errorResponse(res, 400, "Invalid datatypeId");
      }
    } catch (err) {
      console.error("Failed to validate datatype:", err);
      return errorResponse(
        res,
        500,
        "Failed to validate datatype",
        err.message
      );
    }

    db.query(
      "INSERT INTO special_field (name, datatype) VALUES (?, ?)",
      [name, datatypeId],
      async (err, result) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, "Special field already exists");
          }
          console.error("Failed to create special field:", err);
          return errorResponse(
            res,
            500,
            "Failed to create special field",
            err.message
          );
        }
        try {
          const field = await fetchFieldById(result.insertId);
          return success(res, field, 201);
        } catch (fetchError) {
          console.error("Failed to fetch created special field:", fetchError);
          return errorResponse(
            res,
            500,
            "Failed to fetch created special field",
            fetchError.message
          );
        }
      }
    );
  });

  router.put("/:id", async (req, res) => {
    const id = parseNumericParam(req, res, "id", "special field id");
    if (!id) return;

    const name = normalizeString(req.body?.name);
    const datatypeId = validateDatatypeId(req.body?.datatypeId);

    if (!name) {
      return errorResponse(res, 400, "Name is required");
    }
    if (!datatypeId) {
      return errorResponse(res, 400, "datatypeId is required");
    }

    try {
      const datatype = await fetchDatatypeById(datatypeId);
      if (!datatype) {
        return errorResponse(res, 400, "Invalid datatypeId");
      }
    } catch (err) {
      console.error("Failed to validate datatype:", err);
      return errorResponse(
        res,
        500,
        "Failed to validate datatype",
        err.message
      );
    }

    db.query(
      "UPDATE special_field SET name = ?, datatype = ? WHERE id = ?",
      [name, datatypeId, id],
      async (err, result) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, "Special field already exists");
          }
          console.error("Failed to update special field:", err);
          return errorResponse(
            res,
            500,
            "Failed to update special field",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Special field not found");
        }
        try {
          const field = await fetchFieldById(id);
          return success(res, field);
        } catch (fetchError) {
          console.error("Failed to fetch updated special field:", fetchError);
          return errorResponse(
            res,
            500,
            "Failed to fetch updated special field",
            fetchError.message
          );
        }
      }
    );
  });

  router.delete("/:id", (req, res) => {
    const id = parseNumericParam(req, res, "id", "special field id");
    if (!id) return;

    db.query("DELETE FROM special_field WHERE id = ?", [id], (err, result) => {
      if (err) {
        console.error("Failed to delete special field:", err);
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
          "Failed to delete special field",
          err.message
        );
      }
      if (result.affectedRows === 0) {
        return errorResponse(res, 404, "Special field not found");
      }
      return success(res, { id });
    });
  });

  const parseValuePayload = (value, res) => {
    if (typeof value !== "string") {
      errorResponse(res, 400, "Value is required");
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      errorResponse(res, 400, "Value is required");
      return null;
    }
    return trimmed;
  };

  router.get("/:fieldId/values", (req, res) => {
    const fieldId = parseNumericParam(req, res, "fieldId", "special field id");
    if (!fieldId) return;

    db.query(
      "SELECT value FROM special_field_values WHERE field_id = ? ORDER BY value ASC",
      [fieldId],
      (err, results) => {
        if (err) {
          console.error("Failed to fetch special field values:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch special field values",
            err.message
          );
        }
        return success(res, results);
      }
    );
  });

  router.post("/:fieldId/values", (req, res) => {
    const fieldId = parseNumericParam(req, res, "fieldId", "special field id");
    if (!fieldId) return;
    const value = parseValuePayload(req.body?.value, res);
    if (!value) return;

    db.query(
      "INSERT INTO special_field_values (field_id, value) VALUES (?, ?)",
      [fieldId, value],
      (err) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, "Value already exists");
          }
          console.error("Failed to create special field value:", err);
          return errorResponse(
            res,
            500,
            "Failed to create special field value",
            err.message
          );
        }
        return success(res, { field_id: fieldId, value }, 201);
      }
    );
  });

  router.put("/:fieldId/values", (req, res) => {
    const fieldId = parseNumericParam(req, res, "fieldId", "special field id");
    if (!fieldId) return;

    const oldValue = parseValuePayload(req.body?.oldValue, res);
    if (!oldValue) return;
    const newValue = parseValuePayload(req.body?.newValue, res);
    if (!newValue) return;

    if (oldValue === newValue) {
      return errorResponse(res, 400, "Values are the same");
    }

    db.beginTransaction((startErr) => {
      if (startErr) {
        console.error("Failed to start transaction:", startErr);
        return errorResponse(
          res,
          500,
          "Failed to update special field value",
          startErr.message
        );
      }

      const rollback = (rollbackErr, originalErr) => {
        db.rollback(() => {
          if (rollbackErr) {
            console.error("Rollback error:", rollbackErr);
          }
          if (originalErr) {
            console.error("Failed to update special field value:", originalErr);
            if (originalErr.code === DUP_ENTRY_CODE) {
              errorResponse(res, 409, "Value already exists");
            } else {
              errorResponse(
                res,
                500,
                "Failed to update special field value",
                originalErr.message
              );
            }
          }
        });
      };

      db.query(
        "DELETE FROM special_field_values WHERE field_id = ? AND value = ?",
        [fieldId, oldValue],
        (deleteErr, deleteResult) => {
          if (deleteErr) {
            rollback(deleteErr, deleteErr);
            return;
          }
          if (deleteResult.affectedRows === 0) {
            rollback(null, null);
            return errorResponse(res, 404, "Value not found");
          }

          db.query(
            "INSERT INTO special_field_values (field_id, value) VALUES (?, ?)",
            [fieldId, newValue],
            (insertErr) => {
              if (insertErr) {
                rollback(insertErr, insertErr);
                return;
              }
              db.commit((commitErr) => {
                if (commitErr) {
                  rollback(commitErr, commitErr);
                  return;
                }
                return success(res, { field_id: fieldId, value: newValue });
              });
            }
          );
        }
      );
    });
  });

  router.delete("/:fieldId/values", (req, res) => {
    const fieldId = parseNumericParam(req, res, "fieldId", "special field id");
    if (!fieldId) return;
    const value = parseValuePayload(req.body?.value, res);
    if (!value) return;

    db.query(
      "DELETE FROM special_field_values WHERE field_id = ? AND value = ?",
      [fieldId, value],
      (err, result) => {
        if (err) {
          console.error("Failed to delete special field value:", err);
          return errorResponse(
            res,
            500,
            "Failed to delete special field value",
            err.message
          );
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Value not found");
        }
        return success(res, { field_id: fieldId, value });
      }
    );
  });

  return router;
}

module.exports = createSpecialFieldsRouter;
