const express = require("express");

function createOrdersRouter(db) {
  const router = express.Router();

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

  return router;
}

module.exports = createOrdersRouter;
