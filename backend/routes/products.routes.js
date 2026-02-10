const express = require("express");

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

const parseIdParam = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    errorResponse(res, 400, "Invalid product id");
    return null;
  }
  return id;
};

const validateName = (name) => {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length ? trimmed : null;
};

const parseNumericId = (value) => {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
};

const parsePrice = (price) => {
  if (price === undefined || price === null) return null;
  const num = Number(price);
  if (Number.isNaN(num) || num < 0) return null;
  return num;
};

const normalizeOptionalString = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeProductImg = (value) => {
  const normalized = normalizeOptionalString(value);
  if (!normalized) return null;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      const url = new URL(normalized);
      if (url.pathname && url.pathname.startsWith("/uploads/")) {
        return url.pathname;
      }
      return normalized;
    } catch (err) {
      return normalized;
    }
  }
  if (normalized.startsWith("/uploads/")) {
    return normalized;
  }
  return normalized;
};

const normalizeSpecialFields = (value) => {
  if (value == null) return {};
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return null;
};

const validateProductPayload = (body) => {
  const name = validateName(body?.name);
  if (!name) {
    return { error: "Name is required" };
  }

  const price = parsePrice(body?.price);
  if (price === null) {
    return { error: "Price must be a non-negative number" };
  }

  const brandId = parseNumericId(body?.brandId);
  if (!brandId) {
    return { error: "brandId is required" };
  }

  const statusId = parseNumericId(body?.statusId);
  if (!statusId) {
    return { error: "statusId is required" };
  }

  const typeId = parseNumericId(body?.typeId);
  if (!typeId) {
    return { error: "typeId is required" };
  }

  const specialFields = normalizeSpecialFields(body?.specialFields);
  if (specialFields === null) {
    return { error: "specialFields must be an object" };
  }

  return {
    data: {
      name,
      description: normalizeOptionalString(body?.description),
      img: normalizeProductImg(body?.img),
      price,
      brandId,
      statusId,
      typeId,
      specialFields,
    },
  };
};

const makeSelectBaseQuery = () => `
  SELECT
    p.id,
    p.name,
    p.description,
    p.img,
    p.price,
    p.brand AS brandId,
    b.name AS brandName,
    p.status AS statusId,
    ps.name AS statusName,
    p.type AS typeId,
    pt.name AS typeName,
    p.special_filds AS specialFieldsRaw
  FROM product p
  LEFT JOIN brand b ON b.id = p.brand
  LEFT JOIN product_status ps ON ps.id = p.status
  LEFT JOIN product_type pt ON pt.id = p.type
`;

const pickerSelectQuery = () => `
  SELECT
    p.id,
    p.name,
    p.description,
    p.img,
    p.price,
    p.brand AS brandId,
    b.name AS brandName,
    p.status AS statusId,
    ps.name AS statusName,
    p.type AS typeId,
    pt.name AS typeName,
    p.special_filds AS specialFieldsRaw
  FROM product p
  LEFT JOIN brand b ON b.id = p.brand
  LEFT JOIN product_status ps ON ps.id = p.status
  LEFT JOIN product_type pt ON pt.id = p.type
`;

function createProductsRouter(db) {
  const router = express.Router();
  const baseSelect = makeSelectBaseQuery();
  const pickerSelect = pickerSelectQuery();

  const parseLimit = (value) => {
    if (value === undefined || value === null || value === "") {
      return 50;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return 50;
    }
    return Math.min(Math.max(Math.floor(num), 1), 200);
  };

  const fetchProductById = (id) =>
    new Promise((resolve, reject) => {
      db.query(`${baseSelect} WHERE p.id = ? LIMIT 1`, [id], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows[0] || null);
      });
    });

  router.get("/", (req, res) => {
    const {
      search: searchRaw,
      typeId: typeParam,
      brandId: brandParam,
      limit: limitParam,
      offset: offsetParam,
    } = req.query || {};

    const search =
      typeof searchRaw === "string" ? searchRaw.trim() : "";
    const typeId = typeParam ? parseNumericId(typeParam) : null;
    const brandId = brandParam ? parseNumericId(brandParam) : null;
    const conditions = [];
    const params = [];
    if (typeId) {
      conditions.push("p.type = ?");
      params.push(typeId);
    }
    if (brandId) {
      conditions.push("p.brand = ?");
      params.push(brandId);
    }
    if (search) {
      const like = `%${search}%`;
      conditions.push("(p.name LIKE ? OR b.name LIKE ? OR pt.name LIKE ?)");
      params.push(like, like, like);
    }

    const limit = parseLimit(limitParam);
    const offset = Math.max(0, parseInt(offsetParam || 0, 10));

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
    const pickerQuery = `${pickerSelect} ${whereClause} ORDER BY p.name ASC LIMIT ? OFFSET ?`;

    db.query(pickerQuery, [...params, limit, offset], (err, rows) => {
      if (err) {
        console.error("Failed to fetch products:", err);
        errorResponse(
          res,
          500,
          "Failed to fetch products",
          err.message
        );
        return;
      }
      success(res, rows);
    });
    return;
  });

  router.get("/:id", async (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    try {
      const product = await fetchProductById(id);
      if (!product) {
        return errorResponse(res, 404, "Product not found");
      }
      return success(res, product);
    } catch (err) {
      console.error("Failed to fetch product:", err);
      return errorResponse(res, 500, "Failed to fetch product", err.message);
    }
  });

  router.post("/", async (req, res) => {
    const { data, error } = validateProductPayload(req.body || {});
    if (error) {
      return errorResponse(res, 400, error);
    }

    const payload = [
      data.name,
      data.description,
      data.img,
      data.price,
      data.brandId,
      data.statusId,
      data.typeId,
      JSON.stringify(data.specialFields || {}),
    ];

    db.query(
      `INSERT INTO product
        (name, description, img, price, brand, status, type, special_filds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      payload,
      async (err, result) => {
        if (err) {
          console.error("Failed to create product:", err);
          return errorResponse(res, 500, "Failed to create product", err.message);
        }
        try {
          const product = await fetchProductById(result.insertId);
          return success(res, product, 201);
        } catch (fetchError) {
          console.error("Failed to fetch created product:", fetchError);
          return errorResponse(
            res,
            500,
            "Failed to fetch created product",
            fetchError.message
          );
        }
      }
    );
  });

  router.put("/:id", (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    const { data, error } = validateProductPayload(req.body || {});
    if (error) {
      return errorResponse(res, 400, error);
    }

    const payload = [
      data.name,
      data.description,
      data.img,
      data.price,
      data.brandId,
      data.statusId,
      data.typeId,
      JSON.stringify(data.specialFields || {}),
      id,
    ];

    db.query(
      `UPDATE product
       SET name = ?, description = ?, img = ?, price = ?, brand = ?, status = ?, type = ?, special_filds = ?
       WHERE id = ?`,
      payload,
      async (err, result) => {
        if (err) {
          console.error("Failed to update product:", err);
          return errorResponse(res, 500, "Failed to update product", err.message);
        }
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, "Product not found");
        }
        try {
          const product = await fetchProductById(id);
          return success(res, product);
        } catch (fetchError) {
          console.error("Failed to fetch updated product:", fetchError);
          return errorResponse(
            res,
            500,
            "Failed to fetch updated product",
            fetchError.message
          );
        }
      }
    );
  });

  router.delete("/:id", (req, res) => {
    const id = parseIdParam(req, res);
    if (!id) return;

    db.query("DELETE FROM product WHERE id = ?", [id], (err, result) => {
      if (err) {
        console.error("Failed to delete product:", err);
        if (err.code === FK_CONSTRAINT_CODE) {
          return errorResponse(
            res,
            409,
            "Cannot delete: record is used by other entities"
          );
        }
        return errorResponse(res, 500, "Failed to delete product", err.message);
      }
      if (result.affectedRows === 0) {
        return errorResponse(res, 404, "Product not found");
      }
      return success(res, { id });
    });
  });

  return router;
}

module.exports = createProductsRouter;
