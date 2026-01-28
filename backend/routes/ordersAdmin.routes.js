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

  const requireAdmin = (req, res) => {
    const role = Number(req.user?.role);
    if (role !== 1) {
      res.status(403).json({ ok: false, message: "Forbidden" });
      return false;
    }
    return true;
  };

  router.get("/statuses", requireAuth, (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
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

  router.get("/users/manager", requireAuth, (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    db.query(
      "SELECT id, full_name, email FROM users WHERE role = 3 ORDER BY full_name ASC",
      (err, rows) => {
        if (err) {
          console.error("Failed to fetch managers:", err);
          return res
            .status(500)
            .json({ ok: false, message: "Failed to fetch managers" });
        }

        return res.json(rows || []);
      }
    );
  });

  router.get("/users/courier", requireAuth, (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    db.query(
      "SELECT id, full_name, email FROM users WHERE role = 4 ORDER BY full_name ASC",
      (err, rows) => {
        if (err) {
          console.error("Failed to fetch couriers:", err);
          return res
            .status(500)
            .json({ ok: false, message: "Failed to fetch couriers" });
        }

        return res.json(rows || []);
      }
    );
  });

  router.get("/counters", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    try {
      const [statusRows, managerRows, courierRows] = await Promise.all([
        query(
          "SELECT statusId AS `key`, COUNT(*) AS cnt FROM orders GROUP BY statusId"
        ),
        query(
          "SELECT user_id AS `key`, COUNT(*) AS cnt FROM order_assignments WHERE user_role_id = 3 AND active = 1 GROUP BY user_id"
        ),
        query(
          "SELECT user_id AS `key`, COUNT(*) AS cnt FROM order_assignments WHERE user_role_id = 4 AND active = 1 GROUP BY user_id"
        ),
      ]);

      const buildMap = (rows) =>
        rows.reduce((acc, row) => {
          acc[String(row.key)] = Number(row.cnt ?? 0);
          return acc;
        }, {});

      return res.json({
        byStatus: buildMap(statusRows),
        byManager: buildMap(managerRows),
        byCourier: buildMap(courierRows),
      });
    } catch (err) {
      console.error("Failed to fetch order counters:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch counters" });
    }
  });

  router.get("/:id/history", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    try {
      const orderExistsRows = await query(
        "SELECT 1 FROM orders WHERE id = ? LIMIT 1",
        [orderId]
      );
      if (orderExistsRows.length === 0) {
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      const historyRows = await query(
        `
        SELECT
          h.id,
          h.order_id,
          h.oldStatusId,
          h.newStatusId,
          h.note,
          h.changed_at,
          os_old.name AS oldStatusName,
          os_new.name AS newStatusName,
          u.id AS changedById,
          u.full_name AS changedByName,
          u.email AS changedByEmail
        FROM order_status_history h
        LEFT JOIN order_status os_old ON os_old.id = h.oldStatusId
        JOIN order_status os_new ON os_new.id = h.newStatusId
        LEFT JOIN users u ON u.id = h.changed_by
        WHERE h.order_id = ?
        ORDER BY h.changed_at DESC
        `,
        [orderId]
      );

      const items = historyRows.map((row) => ({
        id: row.id,
        order_id: row.order_id,
        oldStatusId: row.oldStatusId,
        oldStatusName: row.oldStatusName ?? null,
        newStatusId: row.newStatusId,
        newStatusName: row.newStatusName ?? null,
        changed_by: row.changedById
          ? {
              id: row.changedById,
              full_name: row.changedByName,
              email: row.changedByEmail,
            }
          : null,
        note: row.note ?? null,
        changed_at: row.changed_at,
      }));

      return res.json({ items });
    } catch (err) {
      console.error("Failed to fetch order history:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch order history" });
    }
  });

  router.get("/:id", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    try {
      const headerRows = await query(
        `
        SELECT
          o.id,
          o.statusId,
          o.comment_client,
          o.comment_internal,
          o.contact_name,
          o.delivery_address,
          o.delivery_phone,
          o.total_price_items,
          o.total_discount,
          o.total_final,
          o.courier_taken_at,
          o.delivered_at,
          o.canceled_reason,
          o.created_at,
          o.updated_at,
          os.name AS statusName,
          u.id AS clientId,
          u.full_name AS clientFullName,
          u.email AS clientEmail,
          u.phone AS clientPhone
        FROM orders o
        JOIN order_status os ON os.id = o.statusId
        JOIN users u ON u.id = o.user_id
        WHERE o.id = ?
        LIMIT 1
        `,
        [orderId]
      );

      const header = headerRows[0];
      if (!header) {
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      const itemsRows = await query(
        `
        SELECT
          oi.id,
          oi.product_id,
          oi.quantity,
          oi.price_each,
          oi.subtotal,
          p.name AS productName,
          p.price AS productPrice,
          p.img AS productImage
        FROM order_items oi
        JOIN product p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        `,
        [orderId]
      );

      const tradeInRows = await query(
        `
        SELECT
          oti.id,
          oti.product_id,
          oti.condition_code,
          oti.base_amount,
          oti.percent,
          oti.discount_amount,
          p.name AS productName,
          p.price AS productPrice,
          p.img AS productImage
        FROM order_trade_in oti
        JOIN product p ON p.id = oti.product_id
        WHERE oti.order_id = ?
        `,
        [orderId]
      );

      const assignmentsRows = await query(
        `
        SELECT
          oa.user_role_id,
          u.id AS userId,
          u.full_name AS userFullName,
          u.email AS userEmail
        FROM order_assignments oa
        JOIN users u ON u.id = oa.user_id
        WHERE oa.order_id = ?
          AND oa.active = 1
          AND oa.user_role_id IN (3, 4)
        `,
        [orderId]
      );

      const assignments = {
        manager: null,
        courier: null,
      };

      assignmentsRows.forEach((row) => {
        const payload = {
          id: row.userId,
          full_name: row.userFullName,
          email: row.userEmail,
        };
        if (Number(row.user_role_id) === 3) {
          assignments.manager = payload;
        }
        if (Number(row.user_role_id) === 4) {
          assignments.courier = payload;
        }
      });

      const items = itemsRows.map((row) => ({
        id: row.id,
        product_id: row.product_id,
        product: {
          id: row.product_id,
          name: row.productName,
          price: row.productPrice,
          img: row.productImage,
        },
        quantity: row.quantity,
        price_each: row.price_each,
        subtotal: row.subtotal,
      }));

      const tradeIn = tradeInRows.map((row) => ({
        id: row.id,
        product_id: row.product_id,
        product: {
          id: row.product_id,
          name: row.productName,
          price: row.productPrice,
          img: row.productImage,
        },
        condition_code: row.condition_code,
        base_amount: row.base_amount,
        percent: row.percent,
        discount_amount: row.discount_amount,
      }));

      return res.json({
        order: {
          id: header.id,
          statusId: header.statusId,
          statusName: header.statusName,
        },
        client: {
          id: header.clientId,
          full_name: header.clientFullName,
          email: header.clientEmail,
          phone: header.clientPhone,
        },
        delivery: {
          contact_name: header.contact_name,
          delivery_address: header.delivery_address,
          delivery_phone: header.delivery_phone,
        },
        comments: {
          comment_client: header.comment_client,
          comment_internal: header.comment_internal,
          canceled_reason: header.canceled_reason,
        },
        totals: {
          total_price_items: header.total_price_items,
          total_discount: header.total_discount,
          total_final: header.total_final,
        },
        timestamps: {
          created_at: header.created_at,
          updated_at: header.updated_at,
          courier_taken_at: header.courier_taken_at,
          delivered_at: header.delivered_at,
        },
        items,
        tradeIn,
        assignments,
      });
    } catch (err) {
      console.error("Failed to fetch admin order details:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch order details" });
    }
  });

  router.get("/", requireAuth, (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
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
