const express = require("express");
const createRequireAuth = require("../middlewares/requireAuth");
const requireAdmin = require("../middlewares/requireAdmin");

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

const parseIdParam = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    errorResponse(res, 400, "Invalid category id");
    return null;
  }
  return id;
};

const validateName = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 45) return null;
  return trimmed;
};

const validateSlug = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 64) return null;
  return trimmed;
};

const normalizeImg = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 100) return undefined;
  if (
    !trimmed.startsWith("/uploads/") &&
    !trimmed.startsWith("/images/")
  ) {
    return undefined;
  }
  return trimmed;
};

const normalizeSortOrder = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const num = Number(value);
  if (!Number.isInteger(num)) {
    return undefined;
  }
  return num;
};

const normalizeIsActive = (value, fallback = 1) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const num = Number(value);
  if (![0, 1].includes(num)) {
    return undefined;
  }
  return num;
};

const duplicateCategoryMessage = (err) => {
  const sqlMessage = String(err?.sqlMessage || "").toLowerCase();
  if (sqlMessage.includes("slug") || sqlMessage.includes("slug_unique")) {
    return "Category slug already exists";
  }
  if (sqlMessage.includes("name") || sqlMessage.includes("name_unique")) {
    return "Category name already exists";
  }
  return "Category name or slug already exists";
};

const parseCategoryPayload = (body) => {
  const name = validateName(body?.name);
  if (!name) {
    return { error: "Name is required and must be <= 45 characters" };
  }

  const slug = validateSlug(body?.slug);
  if (!slug) {
    return { error: "Slug is required and must be <= 64 characters" };
  }

  const img = normalizeImg(body?.img);
  if (img === undefined) {
    return { error: "img must start with /uploads/ or /images/" };
  }

  const sortOrder = normalizeSortOrder(body?.sort_order, 0);
  if (sortOrder === undefined) {
    return { error: "sort_order must be an integer" };
  }

  const isActive = normalizeIsActive(body?.is_active, 1);
  if (isActive === undefined) {
    return { error: "is_active must be 0 or 1" };
  }

  return {
    data: {
      name,
      slug,
      img,
      sortOrder,
      isActive,
    },
  };
};

function createCategoriesRouter(db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    db.query(
      `SELECT id, name, slug, img, sort_order
       FROM product_category
       WHERE is_active = 1
       ORDER BY sort_order ASC, name ASC`,
      (err, rows) => {
        if (err) {
          console.error("Failed to fetch categories:", err);
          return errorResponse(res, 500, "Failed to fetch categories", err.message);
        }
        return success(res, rows || []);
      }
    );
  });

  router.get("/:slug", async (req, res) => {
    const rawSlug = typeof req.params.slug === "string" ? req.params.slug : "";
    if (/\s/.test(rawSlug)) {
      return res.status(404).json({ message: "Category not found" });
    }

    const slug = validateSlug(rawSlug);
    if (!slug) {
      return res.status(404).json({ message: "Category not found" });
    }

    try {
      const [rows] = await db
        .promise()
        .query(
          `SELECT id, name, slug, img
           FROM product_category
           WHERE slug = ? AND is_active = 1
           LIMIT 1`,
          [slug]
        );

      if (!rows.length) {
        return res.status(404).json({ message: "Category not found" });
      }

      const category = rows[0];
      const [typeRows] = await db
        .promise()
        .query(
          `SELECT id, name
           FROM product_type
           WHERE category_id = ?
           ORDER BY name ASC`,
          [category.id]
        );

      return success(res, { category, types: typeRows || [] });
    } catch (err) {
      console.error("Failed to fetch category by slug:", err);
      return errorResponse(res, 500, "Failed to fetch category", err.message);
    }
  });

  return router;
}

function createAdminCategoriesRouter(db) {
  const router = express.Router();
  const requireAuth = createRequireAuth(db);

  router.use(requireAuth, requireAdmin);

  const fetchCategoryById = (id) =>
    new Promise((resolve, reject) => {
      db.query(
        `SELECT id, name, slug, img, sort_order, is_active, created_at, updated_at
         FROM product_category
         WHERE id = ?
         LIMIT 1`,
        [id],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows?.[0] || null);
        }
      );
    });

  router.get("/", (req, res) => {
    db.query(
      `SELECT id, name, slug, img, sort_order, is_active, created_at, updated_at
       FROM product_category
       ORDER BY sort_order ASC, name ASC`,
      (err, rows) => {
        if (err) {
          console.error("Failed to fetch admin categories:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch categories",
            err.message
          );
        }
        return success(res, rows || []);
      }
    );
  });

  router.post("/", async (req, res) => {
    const { data, error } = parseCategoryPayload(req.body);
    if (error) {
      return errorResponse(res, 400, error);
    }

    db.query(
      `INSERT INTO product_category (name, slug, img, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.slug, data.img, data.sortOrder, data.isActive],
      async (err, result) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, duplicateCategoryMessage(err));
          }
          console.error("Failed to create category:", err);
          return errorResponse(res, 500, "Failed to create category", err.message);
        }

        try {
          const created = await fetchCategoryById(result.insertId);
          return success(res, created, 201);
        } catch (fetchErr) {
          console.error("Failed to fetch created category:", fetchErr);
          return errorResponse(
            res,
            500,
            "Failed to fetch created category",
            fetchErr.message
          );
        }
      }
    );
  });

  router.put("/:id", async (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    const { data, error } = parseCategoryPayload(req.body);
    if (error) {
      return errorResponse(res, 400, error);
    }

    db.query(
      `UPDATE product_category
       SET name = ?, slug = ?, img = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [data.name, data.slug, data.img, data.sortOrder, data.isActive, id],
      async (err, result) => {
        if (err) {
          if (err.code === DUP_ENTRY_CODE) {
            return errorResponse(res, 409, duplicateCategoryMessage(err));
          }
          console.error("Failed to update category:", err);
          return errorResponse(res, 500, "Failed to update category", err.message);
        }

        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Category not found");
        }

        try {
          const updated = await fetchCategoryById(id);
          return success(res, updated);
        } catch (fetchErr) {
          console.error("Failed to fetch updated category:", fetchErr);
          return errorResponse(
            res,
            500,
            "Failed to fetch updated category",
            fetchErr.message
          );
        }
      }
    );
  });

  router.patch("/:id/active", async (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    const isActive = normalizeIsActive(req.body?.is_active, undefined);
    if (isActive === undefined) {
      return errorResponse(res, 400, "is_active must be 0 or 1");
    }

    db.query(
      "UPDATE product_category SET is_active = ? WHERE id = ?",
      [isActive, id],
      async (err, result) => {
        if (err) {
          console.error("Failed to update category activity:", err);
          return errorResponse(
            res,
            500,
            "Failed to update category activity",
            err.message
          );
        }

        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Category not found");
        }

        try {
          const updated = await fetchCategoryById(id);
          return success(res, updated);
        } catch (fetchErr) {
          console.error("Failed to fetch updated category:", fetchErr);
          return errorResponse(
            res,
            500,
            "Failed to fetch updated category",
            fetchErr.message
          );
        }
      }
    );
  });

  return router;
}

module.exports = {
  createCategoriesRouter,
  createAdminCategoriesRouter,
};
