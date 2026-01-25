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
