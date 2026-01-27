const express = require("express");
const createRequireAuth = require("../middlewares/requireAuth");

function parseOptionalId(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${fieldName} must be a positive integer` };
  }

  return { value: parsed };
}

function createOrdersAdminRouter(db) {
  const router = express.Router();
  const requireAuth = createRequireAuth(db);

  router.get("/statuses", requireAuth, (req, res) => {
    const role = Number(req.user?.role);
    if (role !== 1) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    db.query(
      "SELECT id, name FROM order_status ORDER BY id ASC",
      (err, rows) => {
        if (err) {
          console.error("Failed to fetch order statuses:", err);
          return res
            .status(500)
            .json({ ok: false, message: "Failed to fetch statuses" });
        }

        return res.json(rows || []);
      }
    );
  });

  router.get("/", requireAuth, (req, res) => {
    const role = Number(req.user?.role);
    if (role !== 1) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const filters = [];
    const params = [];

    const statusId = parseOptionalId(req.query?.statusId, "statusId");
    if (statusId.error) {
      return res.status(400).json({ ok: false, message: statusId.error });
    }
    if (statusId.value !== null) {
      filters.push("o.statusId = ?");
      params.push(statusId.value);
    }

    const clientId = parseOptionalId(req.query?.clientId, "clientId");
    if (clientId.error) {
      return res.status(400).json({ ok: false, message: clientId.error });
    }
    if (clientId.value !== null) {
      filters.push("o.user_id = ?");
      params.push(clientId.value);
    }

    const managerId = parseOptionalId(req.query?.managerId, "managerId");
    if (managerId.error) {
      return res.status(400).json({ ok: false, message: managerId.error });
    }
    if (managerId.value !== null) {
      filters.push("am.user_id = ?");
      params.push(managerId.value);
    }

    const courierId = parseOptionalId(req.query?.courierId, "courierId");
    if (courierId.error) {
      return res.status(400).json({ ok: false, message: courierId.error });
    }
    if (courierId.value !== null) {
      filters.push("ac.user_id = ?");
      params.push(courierId.value);
    }

    const dateFrom = req.query?.dateFrom;
    if (dateFrom) {
      filters.push("o.created_at >= ?");
      params.push(dateFrom);
    }

    const dateTo = req.query?.dateTo;
    if (dateTo) {
      filters.push("o.created_at <= ?");
      params.push(dateTo);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const query = `
      SELECT
        o.id,
        o.created_at AS created_at,
        o.statusId,
        os.name AS statusName,
        o.total_final,
        o.total_discount,
        u.id AS clientId,
        u.full_name AS clientFullName,
        u.email AS clientEmail,
        u.phone AS clientPhone,
        m.id AS managerId,
        m.full_name AS managerFullName,
        c.id AS courierId,
        c.full_name AS courierFullName
      FROM orders o
      JOIN order_status os ON os.id = o.statusId
      JOIN users u ON u.id = o.user_id
      LEFT JOIN (
        SELECT order_id, user_id
        FROM order_assignments
        WHERE user_role_id = 3 AND active = 1
      ) am ON am.order_id = o.id
      LEFT JOIN users m ON m.id = am.user_id
      LEFT JOIN (
        SELECT order_id, user_id
        FROM order_assignments
        WHERE user_role_id = 4 AND active = 1
      ) ac ON ac.order_id = o.id
      LEFT JOIN users c ON c.id = ac.user_id
      ${whereClause}
      ORDER BY o.created_at DESC
    `;

    db.query(query, params, (err, rows) => {
      if (err) {
        console.error("Failed to fetch admin orders:", err);
        return res
          .status(500)
          .json({ ok: false, message: "Failed to fetch orders" });
      }

      const items = (rows || []).map((row) => ({
        id: row.id,
        created_at: row.created_at,
        statusId: row.statusId,
        statusName: row.statusName,
        total_final: Number(row.total_final ?? 0),
        total_discount: Number(row.total_discount ?? 0),
        client: {
          id: row.clientId,
          full_name: row.clientFullName,
          email: row.clientEmail,
          phone: row.clientPhone,
        },
        manager: row.managerId
          ? { id: row.managerId, full_name: row.managerFullName }
          : null,
        courier: row.courierId
          ? { id: row.courierId, full_name: row.courierFullName }
          : null,
      }));

      return res.json(items);
    });
  });

  return router;
}

module.exports = createOrdersAdminRouter;
