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
    errorResponse(res, 400, "Invalid brand id");
    return null;
  }
  return id;
};

function createBrandsRouter(db) {
  const router = express.Router();

  const fetchBrandById = (id) =>
    new Promise((resolve, reject) => {
      db.query("SELECT id, name FROM brand WHERE id = ?", [id], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows[0] || null);
      });
    });

  router.get("/", (req, res) => {
    db.query(
      "SELECT id, name FROM brand ORDER BY id DESC",
      (err, results) => {
        if (err) {
          return errorResponse(res, 500, "Failed to fetch brands", err.message);
        }
        return success(res, results);
      }
    );
  });

  router.get("/:id", async (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;
    try {
      const brand = await fetchBrandById(id);
      if (!brand) {
        return errorResponse(res, 404, "Brand not found");
      }
      return success(res, brand);
    } catch (err) {
      return errorResponse(res, 500, "Failed to fetch brand", err.message);
    }
  });

  router.post("/", (req, res) => {
    const name = validateName(req.body?.name);
    if (!name) {
      return errorResponse(res, 400, "Name is required");
    }

    db.query("INSERT INTO brand (name) VALUES (?)", [name], async (err, result) => {
      if (err) {
        if (err.code === DUP_ENTRY_CODE) {
          return errorResponse(res, 409, "Brand name already exists");
        }
        return errorResponse(res, 500, "Failed to create brand", err.message);
      }
      try {
        const brand = await fetchBrandById(result.insertId);
        return success(res, brand, 201);
      } catch (fetchError) {
        return errorResponse(
          res,
          500,
          "Failed to fetch created brand",
          fetchError.message
        );
      }
    });
  });

  router.put("/:id", (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    const name = validateName(req.body?.name);
    if (!name) {
      return errorResponse(res, 400, "Name is required");
    }

    db.query(
      "UPDATE brand SET name = ? WHERE id = ?",
      [name, id],
      async (err, result) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, "Brand name already exists");
          }
          return errorResponse(res, 500, "Failed to update brand", err.message);
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Brand not found");
        }
        try {
          const brand = await fetchBrandById(id);
          return success(res, brand);
        } catch (fetchError) {
          return errorResponse(
            res,
            500,
            "Failed to fetch updated brand",
            fetchError.message
          );
        }
      }
    );
  });

  router.delete("/:id", (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    db.query("DELETE FROM brand WHERE id = ?", [id], (err, result) => {
      if (err) {
        return errorResponse(res, 500, "Failed to delete brand", err.message);
      }
      if (result.affectedRows === 0) {
        return errorResponse(res, 404, "Brand not found");
      }
      return success(res, { id });
    });
  });

  return router;
}

module.exports = createBrandsRouter;
