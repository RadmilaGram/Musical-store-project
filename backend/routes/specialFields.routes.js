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

const validateName = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const validateDatatypeId = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const parseIdParam = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    errorResponse(res, 400, "Invalid special field id");
    return null;
  }
  return id;
};

function createSpecialFieldsRouter(db) {
  const router = express.Router();

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
    const id = parseIdParam(req, res);
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
    const name = validateName(req.body?.name);
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
    const id = parseIdParam(req, res);
    if (!id) return;

    const name = validateName(req.body?.name);
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
    const id = parseIdParam(req, res);
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

  return router;
}

module.exports = createSpecialFieldsRouter;
