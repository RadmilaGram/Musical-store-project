const express = require("express");
const createRequireAuth = require("../middlewares/requireAuth");

const allowedTransitions = {
  new: ["preparing", "canceled"],
  preparing: ["ready", "canceled"],
  ready: ["delivering", "canceled"],
  delivering: ["finished", "canceled"],
  finished: [],
  canceled: [],
};

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

    const statusId = parseOptionalId(req.query?.statusId, "statusId");
    if (statusId.error) {
      return res.status(400).json({ ok: false, message: statusId.error });
    }

    const managerId = parseOptionalId(req.query?.managerId, "managerId");
    if (managerId.error) {
      return res.status(400).json({ ok: false, message: managerId.error });
    }

    const courierId = parseOptionalId(req.query?.courierId, "courierId");
    if (courierId.error) {
      return res.status(400).json({ ok: false, message: courierId.error });
    }

    const dateFrom = req.query?.dateFrom;
    const dateTo = req.query?.dateTo;
    const qRaw = typeof req.query?.q === "string" ? req.query.q.trim() : "";

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    try {
      const buildWhere = (excludeKey) => {
        const clauses = [];
        const params = [];

        if (excludeKey !== "statusId" && statusId.value !== null) {
          clauses.push("o.statusId = ?");
          params.push(statusId.value);
        }

        if (excludeKey !== "managerId" && managerId.value !== null) {
          clauses.push("am.user_id = ?");
          params.push(managerId.value);
        }

        if (excludeKey !== "courierId" && courierId.value !== null) {
          clauses.push("ac.user_id = ?");
          params.push(courierId.value);
        }

        if (dateFrom) {
          clauses.push("o.created_at >= ?");
          params.push(dateFrom);
        }

        if (dateTo) {
          clauses.push("o.created_at <= ?");
          params.push(dateTo);
        }

        if (qRaw) {
          const likeValue = `%${qRaw}%`;
          clauses.push(
            "(u.email LIKE ? OR u.phone LIKE ? OR u.full_name LIKE ?)"
          );
          params.push(likeValue, likeValue, likeValue);
        }

        return {
          clause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
          params,
        };
      };

      const baseFrom = `
        FROM orders o
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
      `;

      const statusWhere = buildWhere("statusId");
      const managerWhere = buildWhere("managerId");
      const courierWhere = buildWhere("courierId");

      const [statusRows, managerRows, courierRows] = await Promise.all([
        query(
          `
          SELECT o.statusId AS \`key\`, COUNT(*) AS cnt
          ${baseFrom}
          ${statusWhere.clause}
          GROUP BY o.statusId
          `,
          statusWhere.params
        ),
        query(
          `
          SELECT am.user_id AS \`key\`, COUNT(*) AS cnt
          ${baseFrom}
          ${managerWhere.clause}
          GROUP BY am.user_id
          `,
          managerWhere.params
        ),
        query(
          `
          SELECT ac.user_id AS \`key\`, COUNT(*) AS cnt
          ${baseFrom}
          ${courierWhere.clause}
          GROUP BY ac.user_id
          `,
          courierWhere.params
        ),
      ]);

      const buildMap = (rows) =>
        rows.reduce((acc, row) => {
          if (row.key === null || row.key === undefined) {
            return acc;
          }
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

  router.post("/:id/status", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const statusId = Number(req.body?.statusId);
    if (!Number.isInteger(statusId) || statusId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid statusId" });
    }

    const noteRaw = req.body?.note;
    const note = typeof noteRaw === "string" ? noteRaw.trim() : null;

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    const begin = () =>
      new Promise((resolve, reject) => {
        db.beginTransaction((err) => (err ? reject(err) : resolve()));
      });

    const rollback = () =>
      new Promise((resolve) => {
        db.rollback(() => resolve());
      });

    const commit = () =>
      new Promise((resolve, reject) => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() => reject(err));
          }
          resolve();
        });
      });

    try {
      await begin();

      const orderRows = await query(
        `
        SELECT o.id, o.statusId AS oldStatusId, os.name AS oldStatusName
        FROM orders o
        JOIN order_status os ON os.id = o.statusId
        WHERE o.id = ?
        FOR UPDATE
        `,
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      if (Number(orderRow.oldStatusId) === Number(statusId)) {
        await rollback();
        return res
          .status(400)
          .json({ ok: false, message: "Status is already set" });
      }

      const statusRows = await query(
        "SELECT id, name FROM order_status WHERE id = ? LIMIT 1",
        [statusId]
      );
      const statusRow = statusRows?.[0];
      if (!statusRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Status not found" });
      }

      const allowed = allowedTransitions[orderRow.oldStatusName] || [];
      if (!allowed.includes(statusRow.name)) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Invalid status transition" });
      }

      if (
        statusRow.name === "canceled" &&
        ["delivering", "finished"].includes(orderRow.oldStatusName)
      ) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Cancel is not allowed after delivery" });
      }

      await query("UPDATE orders SET statusId = ? WHERE id = ?", [
        statusRow.id,
        orderId,
      ]);
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, ?)",
        [orderId, orderRow.oldStatusId, statusRow.id, req.user?.id, note]
      );

      await commit();
      return res.json({ ok: true, orderId, statusId: statusRow.id });
    } catch (err) {
      await rollback();
      console.error("Failed to update order status:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to update status" });
    }
  });

  router.post("/:id/assign", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const roleId = Number(req.body?.user_role_id);
    const userId = Number(req.body?.user_id);
    if (![3, 4].includes(roleId)) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid user_role_id" });
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid user_id" });
    }

    const roleLabel = roleId === 3 ? "manager" : "courier";
    const note = `Assigned ${roleLabel} to user ${userId}`;

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    const begin = () =>
      new Promise((resolve, reject) => {
        db.beginTransaction((err) => (err ? reject(err) : resolve()));
      });

    const rollback = () =>
      new Promise((resolve) => {
        db.rollback(() => resolve());
      });

    const commit = () =>
      new Promise((resolve, reject) => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() => reject(err));
          }
          resolve();
        });
      });

    try {
      await begin();

      const orderRows = await query(
        "SELECT id, statusId FROM orders WHERE id = ? FOR UPDATE",
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      const userRows = await query(
        "SELECT id, role FROM users WHERE id = ? LIMIT 1",
        [userId]
      );
      const userRow = userRows?.[0];
      if (!userRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "User not found" });
      }
      if (Number(userRow.role) !== roleId) {
        await rollback();
        return res
          .status(400)
          .json({ ok: false, message: "User role mismatch" });
      }

      await query(
        "UPDATE order_assignments SET active = 0, unassigned_at = NOW() WHERE order_id = ? AND user_role_id = ? AND active = 1",
        [orderId, roleId]
      );
      await query(
        "INSERT INTO order_assignments (order_id, user_role_id, user_id, active, assigned_at) VALUES (?, ?, ?, 1, NOW())",
        [orderId, roleId, userId]
      );
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, ?)",
        [orderId, orderRow.statusId, orderRow.statusId, req.user?.id, note]
      );

      await commit();
      return res.json({ ok: true, orderId, user_role_id: roleId, user_id: userId });
    } catch (err) {
      await rollback();
      console.error("Failed to assign user:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to assign user" });
    }
  });

  router.post("/:id/unassign", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const roleId = Number(req.body?.user_role_id);
    if (![3, 4].includes(roleId)) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid user_role_id" });
    }

    const noteRaw = req.body?.note;
    const roleLabel = roleId === 3 ? "manager" : "courier";
    const note =
      typeof noteRaw === "string" && noteRaw.trim()
        ? noteRaw.trim()
        : `Unassigned ${roleLabel}`;

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    const begin = () =>
      new Promise((resolve, reject) => {
        db.beginTransaction((err) => (err ? reject(err) : resolve()));
      });

    const rollback = () =>
      new Promise((resolve) => {
        db.rollback(() => resolve());
      });

    const commit = () =>
      new Promise((resolve, reject) => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() => reject(err));
          }
          resolve();
        });
      });

    try {
      await begin();

      const orderRows = await query(
        "SELECT id, statusId FROM orders WHERE id = ? FOR UPDATE",
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      const result = await query(
        "UPDATE order_assignments SET active = 0, unassigned_at = NOW() WHERE order_id = ? AND user_role_id = ? AND active = 1",
        [orderId, roleId]
      );

      const affectedRows = result?.affectedRows ?? 0;
      if (affectedRows === 0) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "No active assignment" });
      }

      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, ?)",
        [orderId, orderRow.statusId, orderRow.statusId, req.user?.id, note]
      );

      await commit();
      return res.json({ ok: true, orderId, user_role_id: roleId });
    } catch (err) {
      await rollback();
      console.error("Failed to unassign user:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to unassign user" });
    }
  });

  router.post("/:id/cancel", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const reasonRaw = req.body?.reason;
    const reason = typeof reasonRaw === "string" ? reasonRaw.trim() : "";
    if (!reason) {
      return res.status(400).json({ ok: false, message: "Reason is required" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    const begin = () =>
      new Promise((resolve, reject) => {
        db.beginTransaction((err) => (err ? reject(err) : resolve()));
      });

    const rollback = () =>
      new Promise((resolve) => {
        db.rollback(() => resolve());
      });

    const commit = () =>
      new Promise((resolve, reject) => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() => reject(err));
          }
          resolve();
        });
      });

    try {
      await begin();

      const orderRows = await query(
        `
        SELECT o.id, o.statusId AS oldStatusId, os.name AS oldStatusName
        FROM orders o
        JOIN order_status os ON os.id = o.statusId
        WHERE o.id = ?
        FOR UPDATE
        `,
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      if (orderRow.oldStatusName === "canceled") {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order already canceled" });
      }

      if (["delivering", "finished"].includes(orderRow.oldStatusName)) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order cannot be canceled" });
      }

      const canceledRows = await query(
        "SELECT id FROM order_status WHERE name = 'canceled' LIMIT 1"
      );
      const canceledStatusId = canceledRows?.[0]?.id;
      if (!canceledStatusId) {
        await rollback();
        return res
          .status(500)
          .json({ ok: false, message: "Missing order status" });
      }

      await query(
        "UPDATE orders SET statusId = ?, canceled_reason = ? WHERE id = ?",
        [canceledStatusId, reason, orderId]
      );
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, ?)",
        [orderId, orderRow.oldStatusId, canceledStatusId, req.user?.id, reason]
      );

      await commit();
      return res.json({ ok: true, orderId, statusId: canceledStatusId });
    } catch (err) {
      await rollback();
      console.error("Failed to cancel order:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to cancel order" });
    }
  });

  router.patch("/:id/delivery", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const contactName = req.body?.contact_name;
    const deliveryAddress = req.body?.delivery_address;
    const deliveryPhone = req.body?.delivery_phone;

    const updates = [];
    const params = [];

    if (typeof contactName === "string") {
      updates.push("contact_name = ?");
      params.push(contactName);
    }
    if (typeof deliveryAddress === "string") {
      updates.push("delivery_address = ?");
      params.push(deliveryAddress);
    }
    if (typeof deliveryPhone === "string") {
      updates.push("delivery_phone = ?");
      params.push(deliveryPhone);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ ok: false, message: "No delivery fields provided" });
    }

    const changedFields = [];
    if (typeof contactName === "string") changedFields.push("contact_name");
    if (typeof deliveryAddress === "string") changedFields.push("delivery_address");
    if (typeof deliveryPhone === "string") changedFields.push("delivery_phone");
    const note = `Updated delivery fields: ${changedFields.join(", ")}`;

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    const begin = () =>
      new Promise((resolve, reject) => {
        db.beginTransaction((err) => (err ? reject(err) : resolve()));
      });

    const rollback = () =>
      new Promise((resolve) => {
        db.rollback(() => resolve());
      });

    const commit = () =>
      new Promise((resolve, reject) => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() => reject(err));
          }
          resolve();
        });
      });

    try {
      await begin();

      const orderRows = await query(
        "SELECT id, statusId FROM orders WHERE id = ? FOR UPDATE",
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      await query(
        `UPDATE orders SET ${updates.join(", ")} WHERE id = ?`,
        [...params, orderId]
      );
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, ?)",
        [orderId, orderRow.statusId, orderRow.statusId, req.user?.id, note]
      );

      await commit();
      return res.json({ ok: true, orderId });
    } catch (err) {
      await rollback();
      console.error("Failed to update delivery:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to update delivery" });
    }
  });

  router.patch("/:id/comment-internal", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const commentInternal = req.body?.comment_internal;
    if (typeof commentInternal !== "string") {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid comment_internal" });
    }

    const note = "Updated internal comment";

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    const begin = () =>
      new Promise((resolve, reject) => {
        db.beginTransaction((err) => (err ? reject(err) : resolve()));
      });

    const rollback = () =>
      new Promise((resolve) => {
        db.rollback(() => resolve());
      });

    const commit = () =>
      new Promise((resolve, reject) => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() => reject(err));
          }
          resolve();
        });
      });

    try {
      await begin();

      const orderRows = await query(
        "SELECT id, statusId FROM orders WHERE id = ? FOR UPDATE",
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      await query("UPDATE orders SET comment_internal = ? WHERE id = ?", [
        commentInternal,
        orderId,
      ]);
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, ?)",
        [orderId, orderRow.statusId, orderRow.statusId, req.user?.id, note]
      );

      await commit();
      return res.json({ ok: true, orderId });
    } catch (err) {
      await rollback();
      console.error("Failed to update internal comment:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to update comment" });
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

    const qRaw = typeof req.query?.q === "string" ? req.query.q.trim() : "";
    if (qRaw) {
      const likeValue = `%${qRaw}%`;
      filters.push("(u.email LIKE ? OR u.phone LIKE ? OR u.full_name LIKE ?)");
      params.push(likeValue, likeValue, likeValue);
    }

    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const sortMap = {
      created_at: "o.created_at",
      id: "o.id",
      statusId: "o.statusId",
      total_final: "o.total_final",
      client_name: "u.full_name",
      manager_name: "m.full_name",
      courier_name: "c.full_name",
    };
    const sortByRaw = req.query?.sortBy;
    const sortBy = sortMap[sortByRaw] || sortMap.created_at;
    const sortDirRaw = String(req.query?.sortDir || "desc").toLowerCase();
    const sortDir = sortDirRaw === "asc" ? "ASC" : "DESC";

    const limitRaw = Number(req.query?.limit);
    const offsetRaw = Number(req.query?.offset);
    const limit = Number.isInteger(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 20;
    const offset = Number.isInteger(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

    const baseFrom = `
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
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      ${baseFrom}
    `;

    const itemsQuery = `
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
      ${baseFrom}
      ORDER BY ${sortBy} ${sortDir}, o.id DESC
      LIMIT ? OFFSET ?
    `;

    db.query(countQuery, params, (countErr, countRows) => {
      if (countErr) {
        console.error("Failed to fetch admin orders count:", countErr);
        return res
          .status(500)
          .json({ ok: false, message: "Failed to fetch orders" });
      }

      const total = Number(countRows?.[0]?.total ?? 0);

      db.query(itemsQuery, [...params, limit, offset], (err, rows) => {
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

        return res.json({ items, page: { limit, offset, total } });
      });
    });
  });

  return router;
}

module.exports = createOrdersAdminRouter;
