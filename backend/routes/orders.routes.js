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

function createOrdersRouter(db) {
  const router = express.Router();
  const requireAuth = createRequireAuth(db);

  router.get("/my", requireAuth, (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const query = `
      SELECT
        o.id,
        o.created_at AS createdAt,
        s.name AS status,
        o.total_price_items AS itemsTotal,
        o.total_discount AS totalDiscount,
        o.total_final AS total
      FROM orders o
      JOIN order_status s ON s.id = o.statusId
      WHERE o.user_id = ?
      ORDER BY o.id DESC
    `;

    db.query(query, [userId], (err, rows) => {
      if (err) {
        console.error("Failed to fetch orders:", err);
        return res.status(500).json({ ok: false, message: "Failed to fetch orders" });
      }
      const items = (rows || []).map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        status: row.status,
        itemsTotal: Number(row.itemsTotal ?? 0),
        totalDiscount: Number(row.totalDiscount ?? 0),
        total: Number(row.total ?? 0),
      }));
      return res.json({ items });
    });
  });

  router.get("/manager/queue", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 3].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    try {
      const statusRows = await query(
        "SELECT id FROM order_status WHERE name = 'new' LIMIT 1"
      );
      const statusId = statusRows?.[0]?.id;
      if (!statusId) {
        return res
          .status(500)
          .json({ ok: false, message: "Missing order status" });
      }

      const ordersQuery = `
        SELECT
          o.id,
          o.created_at AS createdAt,
          s.name AS status,
          o.total_price_items AS itemsTotal,
          o.total_discount AS totalDiscount,
          o.total_final AS total
        FROM orders o
        JOIN order_status s ON s.id = o.statusId
        WHERE o.statusId = ?
          AND NOT EXISTS (
            SELECT 1
            FROM order_assignments oa
            WHERE oa.order_id = o.id
              AND oa.user_role_id = 3
              AND oa.active = 1
          )
        ORDER BY o.created_at ASC
      `;

      const rows = await query(ordersQuery, [statusId]);
      const items = (rows || []).map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        status: row.status,
        itemsTotal: Number(row.itemsTotal ?? 0),
        totalDiscount: Number(row.totalDiscount ?? 0),
        total: Number(row.total ?? 0),
      }));

      return res.json({ items });
    } catch (err) {
      console.error("Failed to fetch manager queue:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch manager queue" });
    }
  });

  router.get("/manager/my", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 3].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    const params = [];
    const ownershipClause =
      role === 3
        ? "AND oa.user_id = ?"
        : "";

    if (role === 3) {
      params.push(req.user?.id);
    }

    const ordersQuery = `
      SELECT
        o.id,
        o.created_at AS createdAt,
        s.name AS status,
        o.total_price_items AS itemsTotal,
        o.total_discount AS totalDiscount,
        o.total_final AS total
      FROM orders o
      JOIN order_status s ON s.id = o.statusId
      WHERE EXISTS (
        SELECT 1
        FROM order_assignments oa
        WHERE oa.order_id = o.id
          AND oa.user_role_id = 3
          ${ownershipClause}
      )
      ORDER BY o.created_at DESC
    `;

    try {
      const rows = await query(ordersQuery, params);
      const items = (rows || []).map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        status: row.status,
        itemsTotal: Number(row.itemsTotal ?? 0),
        totalDiscount: Number(row.totalDiscount ?? 0),
        total: Number(row.total ?? 0),
      }));
      return res.json({ items });
    } catch (err) {
      console.error("Failed to fetch manager orders:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch manager orders" });
    }
  });

  router.get("/manager/:orderId", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 3].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    try {
      const headerRows = await query(
        `
        SELECT
          o.id,
          o.statusId,
          o.created_at AS createdAt,
          s.name AS status,
          o.total_price_items AS itemsTotal,
          o.total_discount AS totalDiscount,
          o.total_final AS total,
          o.contact_name AS contactName,
          o.delivery_address AS deliveryAddress,
          o.delivery_phone AS deliveryPhone,
          o.comment_client AS commentClient,
          o.comment_internal AS commentInternal,
          u.id AS clientId,
          u.full_name AS clientFullName,
          u.email AS clientEmail
        FROM orders o
        JOIN order_status s ON s.id = o.statusId
        JOIN users u ON u.id = o.user_id
        WHERE o.id = ?
        LIMIT 1
        `,
        [orderId]
      );
      const header = headerRows?.[0];
      if (!header) {
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      if (role === 3) {
        const assignmentRows = await query(
          "SELECT 1 FROM order_assignments WHERE order_id = ? AND user_role_id = 3 AND user_id = ? LIMIT 1",
          [orderId, req.user?.id]
        );
        if (assignmentRows.length === 0) {
          const newStatusRows = await query(
            "SELECT id FROM order_status WHERE name = 'new' LIMIT 1"
          );
          const newStatusId = newStatusRows?.[0]?.id;
          if (!newStatusId || Number(header.statusId) !== Number(newStatusId)) {
            return res.status(403).json({ ok: false, message: "Forbidden" });
          }

          const activeAssignmentRows = await query(
            "SELECT 1 FROM order_assignments WHERE order_id = ? AND user_role_id = 3 AND active = 1 LIMIT 1",
            [orderId]
          );
          if (activeAssignmentRows.length > 0) {
            return res.status(403).json({ ok: false, message: "Forbidden" });
          }
        }
      }

      const itemsRows = await query(
        `
        SELECT
          oi.product_id AS productId,
          p.name AS title,
          b.name AS brandName,
          oi.price_each AS price,
          oi.quantity AS quantity,
          oi.subtotal AS total
        FROM order_items oi
        JOIN product p ON p.id = oi.product_id
        LEFT JOIN brand b ON b.id = p.brand
        WHERE oi.order_id = ?
        `,
        [orderId]
      );

      const tradeInRows = await query(
        `
        SELECT
          oti.product_id AS productId,
          p.name AS title,
          b.name AS brandName,
          oti.base_amount AS baseAmount,
          oti.percent AS percent,
          oti.discount_amount AS discountAmount
        FROM order_trade_in oti
        JOIN product p ON p.id = oti.product_id
        LEFT JOIN brand b ON b.id = p.brand
        WHERE oti.order_id = ?
        `,
        [orderId]
      );

      const items = (itemsRows || []).map((row) => ({
        productId: row.productId,
        title: row.title,
        brandName: row.brandName ?? null,
        price: Number(row.price ?? 0),
        quantity: Number(row.quantity ?? 0),
        total: Number(row.total ?? 0),
      }));

      const tradeInItems = (tradeInRows || []).map((row) => {
        const baseAmount = Number(row.baseAmount ?? 0);
        const percent = Number(row.percent ?? 0);
        const discountAmount = Number(row.discountAmount ?? 0);
        const divisor = baseAmount * (percent / 100);
        const quantity =
          divisor > 0 ? Number((discountAmount / divisor).toFixed(2)) : null;

        return {
          productId: row.productId,
          title: row.title,
          brandName: row.brandName ?? null,
          baseAmount,
          percent,
          quantity,
          discountAmount,
        };
      });

      return res.json({
        order: {
          id: header.id,
          createdAt: header.createdAt,
          status: header.status,
          itemsTotal: Number(header.itemsTotal ?? 0),
          totalDiscount: Number(header.totalDiscount ?? 0),
          total: Number(header.total ?? 0),
          contactName: header.contactName,
          deliveryAddress: header.deliveryAddress,
          deliveryPhone: header.deliveryPhone,
          commentClient: header.commentClient,
          commentInternal: header.commentInternal,
          contact_name: header.contactName,
          delivery_address: header.deliveryAddress,
          delivery_phone: header.deliveryPhone,
          comment_client: header.commentClient,
          comment_internal: header.commentInternal,
        },
        client: {
          id: header.clientId,
          full_name: header.clientFullName,
          email: header.clientEmail,
        },
        items,
        tradeInItems,
      });
    } catch (err) {
      console.error("Failed to fetch manager order:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch manager order" });
    }
  });

  router.get("/manager/:orderId/history", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 3].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    try {
      if (role === 3) {
        const assignmentRows = await query(
          "SELECT 1 FROM order_assignments WHERE order_id = ? AND user_role_id = 3 AND user_id = ? LIMIT 1",
          [orderId, req.user?.id]
        );
        if (assignmentRows.length === 0) {
          return res.status(403).json({ ok: false, message: "Forbidden" });
        }
      }

      const historyRows = await query(
        `
        SELECT
          h.changed_at AS changedAt,
          os_old.name AS oldStatus,
          os_new.name AS newStatus,
          u.full_name AS changedByName,
          u.email AS changedByEmail,
          h.note AS note
        FROM order_status_history h
        LEFT JOIN order_status os_old ON os_old.id = h.oldStatusId
        LEFT JOIN order_status os_new ON os_new.id = h.newStatusId
        LEFT JOIN users u ON u.id = h.changed_by
        WHERE h.order_id = ?
        ORDER BY h.changed_at ASC
        `,
        [orderId]
      );

      const history = (historyRows || []).map((row) => ({
        changedAt: row.changedAt,
        oldStatus: row.oldStatus ?? null,
        newStatus: row.newStatus ?? null,
        changedBy: row.changedByName || row.changedByEmail || null,
        note: row.note ?? null,
      }));

      return res.json({ items: history });
    } catch (err) {
      console.error("Failed to fetch order history:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch order history" });
    }
  });

  router.post("/:orderId/manager/cancel", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 3].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const reasonRaw = req.body?.reason;
    const reason =
      typeof reasonRaw === "string" ? reasonRaw.trim() : "";
    if (!reason) {
      return res.status(400).json({ ok: false, message: "Reason is required" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
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
        SELECT o.id, o.statusId, s.name AS statusName
        FROM orders o
        JOIN order_status s ON s.id = o.statusId
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

      if (orderRow.statusName === "canceled") {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order already canceled" });
      }

      if (role === 3) {
        const assignmentRows = await query(
          "SELECT 1 FROM order_assignments WHERE order_id = ? AND user_role_id = 3 AND user_id = ? LIMIT 1",
          [orderId, req.user?.id]
        );
        if (assignmentRows.length === 0) {
          await rollback();
          return res.status(403).json({ ok: false, message: "Forbidden" });
        }

        if (!["new", "preparing", "ready"].includes(orderRow.statusName)) {
          await rollback();
          return res
            .status(409)
            .json({ ok: false, message: "Order cannot be canceled" });
        }
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
        [orderId, orderRow.statusId, canceledStatusId, req.user?.id, reason]
      );

      await commit();
      return res.json({ ok: true, orderId, status: "canceled" });
    } catch (err) {
      await rollback();
      console.error("Failed to cancel order:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to cancel order" });
    }
  });

  router.post("/:orderId/manager/take", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 3].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
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

      const statusRows = await query(
        "SELECT id, name FROM order_status WHERE name IN ('new', 'preparing')"
      );
      const statusByName = new Map(statusRows.map((row) => [row.name, row.id]));
      const newStatusId = statusByName.get("new");
      const preparingStatusId = statusByName.get("preparing");
      if (!newStatusId || !preparingStatusId) {
        await rollback();
        return res
          .status(500)
          .json({ ok: false, message: "Missing order status" });
      }

      const orderRows = await query(
        "SELECT id, statusId FROM orders WHERE id = ? FOR UPDATE",
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      if (Number(orderRow.statusId) !== Number(newStatusId)) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order is not new" });
      }

      const assignmentRows = await query(
        "SELECT 1 FROM order_assignments WHERE order_id = ? AND user_role_id = 3 AND active = 1 LIMIT 1",
        [orderId]
      );
      if (assignmentRows.length > 0) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order already assigned" });
      }

      await query(
        "INSERT INTO order_assignments (order_id, user_role_id, user_id, active, assigned_at) VALUES (?, 3, ?, 1, NOW())",
        [orderId, req.user?.id]
      );
      await query("UPDATE orders SET statusId = ? WHERE id = ?", [
        preparingStatusId,
        orderId,
      ]);
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, NULL)",
        [orderId, newStatusId, preparingStatusId, req.user?.id]
      );

      await commit();
      return res.json({ ok: true, orderId, status: "preparing" });
    } catch (err) {
      await rollback();
      console.error("Failed to take order:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to take order" });
    }
  });

  router.post("/:orderId/manager/mark-ready", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 3].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const noteRaw = req.body?.note;
    const note =
      typeof noteRaw === "string" ? noteRaw.trim() : null;

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
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

      const statusRows = await query(
        "SELECT id, name FROM order_status WHERE name IN ('preparing', 'ready')"
      );
      const statusByName = new Map(statusRows.map((row) => [row.name, row.id]));
      const preparingStatusId = statusByName.get("preparing");
      const readyStatusId = statusByName.get("ready");
      if (!preparingStatusId || !readyStatusId) {
        await rollback();
        return res
          .status(500)
          .json({ ok: false, message: "Missing order status" });
      }

      const orderRows = await query(
        "SELECT id, statusId FROM orders WHERE id = ? FOR UPDATE",
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      if (Number(orderRow.statusId) !== Number(preparingStatusId)) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order is not preparing" });
      }

      const assignmentRows = await query(
        "SELECT user_id AS userId FROM order_assignments WHERE order_id = ? AND user_role_id = 3 AND active = 1 LIMIT 1",
        [orderId]
      );
      const assignment = assignmentRows?.[0];
      if (!assignment) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order is not assigned" });
      }

      if (role === 3 && Number(assignment.userId) !== Number(req.user?.id)) {
        await rollback();
        return res.status(403).json({ ok: false, message: "Forbidden" });
      }

      await query("UPDATE orders SET statusId = ? WHERE id = ?", [
        readyStatusId,
        orderId,
      ]);
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, ?)",
        [
          orderId,
          preparingStatusId,
          readyStatusId,
          req.user?.id,
          note || null,
        ]
      );

      await commit();
      return res.json({ ok: true, orderId, status: "ready" });
    } catch (err) {
      await rollback();
      console.error("Failed to mark order ready:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to mark order ready" });
    }
  });

  router.get("/courier/queue", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 4].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    try {
      const statusRows = await query(
        "SELECT id FROM order_status WHERE name = 'ready' LIMIT 1"
      );
      const statusId = statusRows?.[0]?.id;
      if (!statusId) {
        return res
          .status(500)
          .json({ ok: false, message: "Missing order status" });
      }

      const ordersQuery = `
        SELECT
          o.id,
          o.created_at AS createdAt,
          s.name AS status,
          o.total_price_items AS itemsTotal,
          o.total_discount AS totalDiscount,
          o.total_final AS total
        FROM orders o
        JOIN order_status s ON s.id = o.statusId
        WHERE o.statusId = ?
          AND NOT EXISTS (
            SELECT 1
            FROM order_assignments oa
            WHERE oa.order_id = o.id
              AND oa.user_role_id = 4
              AND oa.active = 1
          )
        ORDER BY o.created_at ASC
      `;

      const rows = await query(ordersQuery, [statusId]);
      const items = (rows || []).map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        status: row.status,
        itemsTotal: Number(row.itemsTotal ?? 0),
        totalDiscount: Number(row.totalDiscount ?? 0),
        total: Number(row.total ?? 0),
      }));

      return res.json({ items });
    } catch (err) {
      console.error("Failed to fetch courier queue:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch courier queue" });
    }
  });

  router.get("/courier/my", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 4].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    try {
      const ordersQuery = `
        SELECT
          o.id,
          o.created_at AS createdAt,
          s.name AS status,
          o.total_price_items AS itemsTotal,
          o.total_discount AS totalDiscount,
          o.total_final AS total
        FROM orders o
        JOIN order_status s ON s.id = o.statusId
        WHERE EXISTS (
          SELECT 1
          FROM order_assignments oa
          WHERE oa.order_id = o.id
            AND oa.user_role_id = 4
            AND oa.user_id = ?
            AND oa.active = 1
        )
        ORDER BY o.created_at DESC
      `;

      const rows = await query(ordersQuery, [req.user?.id]);
      const items = (rows || []).map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        status: row.status,
        itemsTotal: Number(row.itemsTotal ?? 0),
        totalDiscount: Number(row.totalDiscount ?? 0),
        total: Number(row.total ?? 0),
      }));

      return res.json({ items });
    } catch (err) {
      console.error("Failed to fetch courier orders:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch courier orders" });
    }
  });

  router.post("/:orderId/courier/take", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 4].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
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

      const statusRows = await query(
        "SELECT id, name FROM order_status WHERE name IN ('ready', 'delivering')"
      );
      const statusByName = new Map(statusRows.map((row) => [row.name, row.id]));
      const readyStatusId = statusByName.get("ready");
      const deliveringStatusId = statusByName.get("delivering");
      if (!readyStatusId || !deliveringStatusId) {
        await rollback();
        return res
          .status(500)
          .json({ ok: false, message: "Missing order status" });
      }

      const orderRows = await query(
        "SELECT id, statusId, delivery_phone AS deliveryPhone FROM orders WHERE id = ? FOR UPDATE",
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      if (Number(orderRow.statusId) !== Number(readyStatusId)) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order is not ready" });
      }

      const deliveryPhone = String(orderRow.deliveryPhone || "").trim();
      if (!deliveryPhone) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Delivery phone is required" });
      }

      const assignmentRows = await query(
        "SELECT 1 FROM order_assignments WHERE order_id = ? AND user_role_id = 4 AND active = 1 LIMIT 1",
        [orderId]
      );
      if (assignmentRows.length > 0) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order already assigned" });
      }

      await query(
        "INSERT INTO order_assignments (order_id, user_role_id, user_id, active, assigned_at) VALUES (?, 4, ?, 1, NOW())",
        [orderId, req.user?.id]
      );
      await query(
        "UPDATE orders SET statusId = ?, courier_taken_at = NOW() WHERE id = ?",
        [deliveringStatusId, orderId]
      );
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, NULL)",
        [orderId, readyStatusId, deliveringStatusId, req.user?.id]
      );

      await commit();
      return res.json({ ok: true, orderId, status: "delivering" });
    } catch (err) {
      await rollback();
      console.error("Failed to take courier order:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to take order" });
    }
  });

  router.post("/:orderId/courier/finish", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 4].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const noteRaw = req.body?.note;
    const note =
      typeof noteRaw === "string" ? noteRaw.trim() : null;

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
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

      const statusRows = await query(
        "SELECT id, name FROM order_status WHERE name IN ('delivering', 'finished')"
      );
      const statusByName = new Map(statusRows.map((row) => [row.name, row.id]));
      const deliveringStatusId = statusByName.get("delivering");
      const finishedStatusId = statusByName.get("finished");
      if (!deliveringStatusId || !finishedStatusId) {
        await rollback();
        return res
          .status(500)
          .json({ ok: false, message: "Missing order status" });
      }

      const orderRows = await query(
        "SELECT id, statusId FROM orders WHERE id = ? FOR UPDATE",
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      if (Number(orderRow.statusId) !== Number(deliveringStatusId)) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Order is not delivering" });
      }

      const assignmentRows = await query(
        "SELECT 1 FROM order_assignments WHERE order_id = ? AND user_role_id = 4 AND user_id = ? AND active = 1 LIMIT 1",
        [orderId, req.user?.id]
      );
      if (assignmentRows.length === 0) {
        await rollback();
        return res.status(403).json({ ok: false, message: "Forbidden" });
      }

      await query(
        "UPDATE orders SET statusId = ?, delivered_at = NOW() WHERE id = ?",
        [finishedStatusId, orderId]
      );
      await query(
        "UPDATE order_assignments SET active = 0, unassigned_at = NOW() WHERE order_id = ? AND user_role_id = 4 AND user_id = ? AND active = 1",
        [orderId, req.user?.id]
      );
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, ?, ?)",
        [
          orderId,
          deliveringStatusId,
          finishedStatusId,
          req.user?.id,
          note || null,
        ]
      );

      await commit();
      return res.json({ ok: true, orderId, status: "finished" });
    } catch (err) {
      await rollback();
      console.error("Failed to finish courier order:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to finish order" });
    }
  });

  router.get("/courier/:orderId", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 4].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    try {
      const headerRows = await query(
        `
        SELECT
          o.id,
          o.statusId,
          o.created_at AS createdAt,
          s.name AS status,
          o.total_price_items AS itemsTotal,
          o.total_discount AS totalDiscount,
          o.total_final AS total,
          o.contact_name AS contactName,
          o.delivery_address AS deliveryAddress,
          o.delivery_phone AS deliveryPhone,
          o.comment_client AS commentClient,
          o.comment_internal AS commentInternal,
          o.courier_taken_at AS courierTakenAt,
          o.delivered_at AS deliveredAt,
          o.canceled_reason AS canceledReason
        FROM orders o
        JOIN order_status s ON s.id = o.statusId
        WHERE o.id = ?
        LIMIT 1
        `,
        [orderId]
      );
      const header = headerRows?.[0];
      if (!header) {
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      if (role === 4) {
        const assignmentRows = await query(
          "SELECT 1 FROM order_assignments WHERE order_id = ? AND user_role_id = 4 AND user_id = ? AND active = 1 LIMIT 1",
          [orderId, req.user?.id]
        );
        if (assignmentRows.length === 0) {
          return res.status(403).json({ ok: false, message: "Forbidden" });
        }
      }

      const itemsRows = await query(
        `
        SELECT
          oi.product_id AS productId,
          p.name AS title,
          b.name AS brandName,
          oi.price_each AS price,
          oi.quantity AS quantity,
          oi.subtotal AS total
        FROM order_items oi
        JOIN product p ON p.id = oi.product_id
        LEFT JOIN brand b ON b.id = p.brand
        WHERE oi.order_id = ?
        `,
        [orderId]
      );

      const tradeInRows = await query(
        `
        SELECT
          oti.product_id AS productId,
          p.name AS title,
          b.name AS brandName,
          oti.base_amount AS baseAmount,
          oti.percent AS percent,
          oti.discount_amount AS discountAmount
        FROM order_trade_in oti
        JOIN product p ON p.id = oti.product_id
        LEFT JOIN brand b ON b.id = p.brand
        WHERE oti.order_id = ?
        `,
        [orderId]
      );

      const items = (itemsRows || []).map((row) => ({
        productId: row.productId,
        title: row.title,
        brandName: row.brandName ?? null,
        price: Number(row.price ?? 0),
        quantity: Number(row.quantity ?? 0),
        total: Number(row.total ?? 0),
      }));

      const tradeInItems = (tradeInRows || []).map((row) => {
        const baseAmount = Number(row.baseAmount ?? 0);
        const percent = Number(row.percent ?? 0);
        const discountAmount = Number(row.discountAmount ?? 0);
        const divisor = baseAmount * (percent / 100);
        const quantity =
          divisor > 0 ? Number((discountAmount / divisor).toFixed(2)) : null;

        return {
          productId: row.productId,
          title: row.title,
          brandName: row.brandName ?? null,
          baseAmount,
          percent,
          quantity,
          discountAmount,
        };
      });

      return res.json({
        order: {
          id: header.id,
          createdAt: header.createdAt,
          status: header.status,
          itemsTotal: Number(header.itemsTotal ?? 0),
          totalDiscount: Number(header.totalDiscount ?? 0),
          total: Number(header.total ?? 0),
          contactName: header.contactName,
          deliveryAddress: header.deliveryAddress,
          deliveryPhone: header.deliveryPhone,
          commentClient: header.commentClient,
          commentInternal: header.commentInternal,
          courierTakenAt: header.courierTakenAt,
          deliveredAt: header.deliveredAt,
          canceledReason: header.canceledReason,
          contact_name: header.contactName,
          delivery_address: header.deliveryAddress,
          delivery_phone: header.deliveryPhone,
          comment_client: header.commentClient,
          comment_internal: header.commentInternal,
        },
        items,
        tradeInItems,
      });
    } catch (err) {
      console.error("Failed to fetch courier order:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch courier order" });
    }
  });

  router.get("/courier/:orderId/history", requireAuth, async (req, res) => {
    const role = Number(req.user?.role);
    if (![1, 4].includes(role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    try {
      if (role === 4) {
        const assignmentRows = await query(
          "SELECT 1 FROM order_assignments WHERE order_id = ? AND user_role_id = 4 AND user_id = ? AND active = 1 LIMIT 1",
          [orderId, req.user?.id]
        );
        if (assignmentRows.length === 0) {
          return res.status(403).json({ ok: false, message: "Forbidden" });
        }
      }

      const historyRows = await query(
        `
        SELECT
          h.changed_at AS changedAt,
          os_old.name AS oldStatus,
          os_new.name AS newStatus,
          u.full_name AS changedByName,
          u.email AS changedByEmail,
          h.note AS note
        FROM order_status_history h
        LEFT JOIN order_status os_old ON os_old.id = h.oldStatusId
        LEFT JOIN order_status os_new ON os_new.id = h.newStatusId
        LEFT JOIN users u ON u.id = h.changed_by
        WHERE h.order_id = ?
        ORDER BY h.changed_at ASC
        `,
        [orderId]
      );

      const history = (historyRows || []).map((row) => ({
        changedAt: row.changedAt,
        oldStatus: row.oldStatus ?? null,
        newStatus: row.newStatus ?? null,
        changedBy: row.changedByName || row.changedByEmail || null,
        note: row.note ?? null,
      }));

      return res.json({ items: history });
    } catch (err) {
      console.error("Failed to fetch courier order history:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch courier order history" });
    }
  });

  router.get("/my/:id", requireAuth, (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const headerQuery = `
      SELECT
        o.id,
        o.created_at AS createdAt,
        s.name AS status,
        o.total_price_items AS itemsTotal,
        o.total_discount AS totalDiscount,
        o.total_final AS total,
        o.contact_name AS contactName,
        o.delivery_address AS deliveryAddress,
        o.delivery_phone AS deliveryPhone,
        o.comment_client AS commentClient
      FROM orders o
      JOIN order_status s ON s.id = o.statusId
      WHERE o.id = ? AND o.user_id = ?
      LIMIT 1
    `;

    db.query(headerQuery, [orderId, userId], (headerErr, headerRows) => {
      if (headerErr) {
        console.error("Failed to fetch order header:", headerErr);
        return res
          .status(500)
          .json({ ok: false, message: "Failed to fetch order" });
      }

      const header = headerRows?.[0];
      if (!header) {
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      const itemsQuery = `
        SELECT
          oi.product_id AS productId,
          p.name AS title,
          b.name AS brandName,
          oi.price_each AS price,
          oi.quantity AS quantity,
          oi.subtotal AS total
        FROM order_items oi
        JOIN product p ON p.id = oi.product_id
        LEFT JOIN brand b ON b.id = p.brand
        WHERE oi.order_id = ?
      `;

      db.query(itemsQuery, [orderId], (itemsErr, itemRows) => {
        if (itemsErr) {
          console.error("Failed to fetch order items:", itemsErr);
          return res
            .status(500)
            .json({ ok: false, message: "Failed to fetch order items" });
        }

        const items = (itemRows || []).map((row) => ({
          productId: row.productId,
          title: row.title,
          brandName: row.brandName ?? null,
          price: Number(row.price ?? 0),
          quantity: Number(row.quantity ?? 0),
          total: Number(row.total ?? 0),
        }));

        const tradeInQuery = `
          SELECT
            oti.product_id AS productId,
            p.name AS title,
            b.name AS brandName,
            oti.base_amount AS baseAmount,
            oti.percent AS percent,
            oti.discount_amount AS discountAmount
          FROM order_trade_in oti
          JOIN product p ON p.id = oti.product_id
          LEFT JOIN brand b ON b.id = p.brand
          WHERE oti.order_id = ?
        `;

        db.query(tradeInQuery, [orderId], (tradeErr, tradeRows) => {
          if (tradeErr) {
            console.error("Failed to fetch trade-in items:", tradeErr);
            return res
              .status(500)
              .json({ ok: false, message: "Failed to fetch trade-in items" });
          }

          const tradeInItems = (tradeRows || []).map((row) => {
            const baseAmount = Number(row.baseAmount ?? 0);
            const percent = Number(row.percent ?? 0);
            const discountAmount = Number(row.discountAmount ?? 0);
            const divisor = baseAmount * (percent / 100);
            const quantity =
              divisor > 0 ? Number((discountAmount / divisor).toFixed(2)) : null;

            return {
              productId: row.productId,
              title: row.title,
              brandName: row.brandName ?? null,
              baseAmount,
              percent,
              quantity,
              discountAmount,
            };
          });

          return res.json({
            order: {
              id: header.id,
              createdAt: header.createdAt,
              status: header.status,
              itemsTotal: Number(header.itemsTotal ?? 0),
              totalDiscount: Number(header.totalDiscount ?? 0),
              total: Number(header.total ?? 0),
              contactName: header.contactName,
              deliveryAddress: header.deliveryAddress,
              deliveryPhone: header.deliveryPhone,
              commentClient: header.commentClient,
            },
            items,
            tradeInItems,
          });
        });
      });
    });
  });

  router.post("/", async (req, res) => {
    const { userId, items, delivery, tradeInItems } = req.body || {};

    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Items are required" });
    }
    if (!delivery?.deliveryAddress || !delivery?.deliveryPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Delivery data is required" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
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
      const normalizedItems = items.map((item) => ({
        productId: item?.productId ?? item?.product_id ?? item?.id,
        quantity: Number(item?.quantity ?? 0),
      }));

      if (normalizedItems.some((item) => !item.productId || item.quantity <= 0)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid items payload" });
      }

      const normalizedTradeInItems = Array.isArray(tradeInItems)
        ? tradeInItems.map((item) => ({
            productId:
              item?.productId ??
              item?.product_id ??
              item?.id ??
              item?.prod?.id,
            conditionCode: item?.conditionCode,
            quantity: Number(item?.quantity ?? 0),
          }))
        : [];

      if (
        normalizedTradeInItems.some(
          (item) =>
            !item.productId || !item.conditionCode || item.quantity <= 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid trade-in items payload",
        });
      }

      await begin();

      const statusRows = await query(
        "SELECT id FROM order_status WHERE name = 'new' LIMIT 1"
      );
      const statusId = statusRows?.[0]?.id;
      if (!statusId) {
        throw new Error("Missing order status");
      }

      const productIds = [
        ...new Set(normalizedItems.map((item) => item.productId)),
      ];
      const productPlaceholders = productIds.map(() => "?").join(", ");
      const productRows = await query(
        `SELECT id, price FROM product WHERE id IN (${productPlaceholders})`,
        productIds
      );
      const priceById = new Map(
        productRows.map((row) => [row.id, Number(row.price)])
      );

      if (priceById.size !== productIds.length) {
        throw new Error("Unknown product in order");
      }

      const orderItems = normalizedItems.map((item) => {
        const price = priceById.get(item.productId);
        const subtotal = price * item.quantity;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price_each: price,
          subtotal,
        };
      });

      const itemsTotal = orderItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );

      let rawDiscount = 0;
      let tradeInRows = [];
      if (normalizedTradeInItems.length > 0) {
        const conditionCodes = [
          ...new Set(normalizedTradeInItems.map((item) => item.conditionCode)),
        ];
        const conditionPlaceholders = conditionCodes.map(() => "?").join(", ");
        const conditionRows = await query(
          `SELECT code, percent FROM trade_in_conditions WHERE code IN (${conditionPlaceholders})`,
          conditionCodes
        );
        const percentByCode = new Map(
          conditionRows.map((row) => [row.code, Number(row.percent)])
        );

        const tradeInProductIds = [
          ...new Set(normalizedTradeInItems.map((item) => item.productId)),
        ];
        const tradeInProductPlaceholders = tradeInProductIds
          .map(() => "?")
          .join(", ");
        const catalogRows = await query(
          `SELECT product_id, base_discount_amount FROM trade_in_catalog WHERE product_id IN (${tradeInProductPlaceholders})`,
          tradeInProductIds
        );
        const baseByProductId = new Map(
          catalogRows.map((row) => [
            row.product_id,
            Number(row.base_discount_amount ?? 0),
          ])
        );

        tradeInRows = normalizedTradeInItems.map((item) => {
          const baseAmount = baseByProductId.get(item.productId) ?? 0;
          const percent = percentByCode.get(item.conditionCode) ?? 0;
          const percentFactor = percent / 100;
          const discountAmount = baseAmount * percentFactor * item.quantity;
          rawDiscount += discountAmount;
          return {
            productId: item.productId,
            conditionCode: item.conditionCode,
            baseAmount,
            percent,
            discountAmount,
          };
        });
      }

      const totalDiscount = Math.min(rawDiscount, itemsTotal * 0.5);
      const totalFinal = itemsTotal - totalDiscount;

      const orderResult = await query(
        "INSERT INTO orders (user_id, statusId, comment_client, contact_name, delivery_address, delivery_phone, total_price_items, total_discount, total_final) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userId,
          statusId,
          delivery?.commentClient || null,
          delivery?.contactName || null,
          delivery?.deliveryAddress,
          delivery?.deliveryPhone,
          itemsTotal,
          totalDiscount,
          totalFinal,
        ]
      );
      const orderId = orderResult.insertId;

      const orderItemsValues = orderItems.map((item) => [
        orderId,
        item.productId,
        item.quantity,
        item.price_each,
        item.subtotal,
      ]);
      const orderItemsPlaceholders = orderItemsValues
        .map(() => "(?, ?, ?, ?, ?)")
        .join(", ");
      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_each, subtotal) VALUES ${orderItemsPlaceholders}`,
        orderItemsValues.flat()
      );

      if (tradeInRows.length > 0) {
        const tradeInValues = tradeInRows.map((item) => [
          orderId,
          item.productId,
          item.conditionCode,
          item.baseAmount,
          item.percent,
          item.discountAmount,
        ]);
        const tradeInPlaceholders = tradeInValues
          .map(() => "(?, ?, ?, ?, ?, ?)")
          .join(", ");
        await query(
          `INSERT INTO order_trade_in (order_id, product_id, condition_code, base_amount, percent, discount_amount) VALUES ${tradeInPlaceholders}`,
          tradeInValues.flat()
        );
      }

      await commit();
      return res.json({ success: true, orderId });
    } catch (err) {
      await rollback();
      console.error("Order creation failed:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to create order" });
    }
  });

  router.patch("/:orderId/status", requireAuth, async (req, res) => {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid orderId" });
    }

    const rawStatus = req.body?.status;
    const newStatusName = typeof rawStatus === "string" ? rawStatus.trim() : "";
    if (!newStatusName) {
      return res.status(400).json({ ok: false, message: "Invalid status" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
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
        "SELECT o.id, o.user_id AS userId, o.statusId AS oldStatusId, os.name AS oldStatusName FROM orders o JOIN order_status os ON os.id = o.statusId WHERE o.id = ? FOR UPDATE",
        [orderId]
      );
      const orderRow = orderRows?.[0];
      if (!orderRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Order not found" });
      }

      const statusRows = await query(
        "SELECT id, name FROM order_status WHERE name = ? LIMIT 1",
        [newStatusName]
      );
      const statusRow = statusRows?.[0];
      if (!statusRow) {
        await rollback();
        return res.status(404).json({ ok: false, message: "Status not found" });
      }

      if (statusRow.id === orderRow.oldStatusId) {
        await rollback();
        return res
          .status(400)
          .json({ ok: false, message: "Status unchanged" });
      }

      if (statusRow.name === "canceled") {
        if (Number(orderRow.userId) !== Number(req.user?.id)) {
          await rollback();
          return res.status(404).json({ ok: false, message: "Order not found" });
        }
        if (!["new", "preparing", "ready"].includes(orderRow.oldStatusName)) {
          await rollback();
          return res
            .status(400)
            .json({ ok: false, message: "Invalid status transition" });
        }
      }

      const allowed = allowedTransitions[orderRow.oldStatusName] || [];
      if (!allowed.includes(statusRow.name)) {
        await rollback();
        return res
          .status(400)
          .json({ ok: false, message: "Invalid status transition" });
      }

      await query("UPDATE orders SET statusId = ? WHERE id = ?", [
        statusRow.id,
        orderId,
      ]);
      await query(
        "INSERT INTO order_status_history (order_id, oldStatusId, newStatusId, changed_by, note) VALUES (?, ?, ?, NULL, NULL)",
        [orderId, orderRow.oldStatusId, statusRow.id]
      );

      await commit();
      return res.json({
        ok: true,
        orderId,
        oldStatusId: orderRow.oldStatusId,
        newStatusId: statusRow.id,
      });
    } catch (err) {
      await rollback();
      console.error("Failed to update order status:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to update status" });
    }
  });

  return router;
}

module.exports = createOrdersRouter;
