const express = require("express");
const createRequireAuth = require("../middlewares/requireAuth");

function createUsersRouter(db) {
  const router = express.Router();
  const requireAuth = createRequireAuth(db);

  const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

  router.get("/me", requireAuth, (req, res) => {
    return res.json({ user: req.user });
  });

  router.patch("/me", requireAuth, async (req, res) => {
    const fullNameRaw = req.body?.full_name;
    const phoneRaw = req.body?.phone;
    const addressRaw = req.body?.address;

    const updates = [];
    const params = [];

    if (typeof fullNameRaw === "string") {
      updates.push("full_name = ?");
      params.push(fullNameRaw.trim());
    }

    if (typeof phoneRaw === "string") {
      updates.push("phone = ?");
      params.push(phoneRaw.trim());
    }

    if (typeof addressRaw === "string") {
      updates.push("address = ?");
      params.push(addressRaw.trim());
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ ok: false, message: "No fields to update" });
    }

    try {
      await query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        [...params, req.user?.id]
      );

      const rows = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [
        req.user?.id,
      ]);
      const user = rows?.[0];
      if (!user) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }

      const { password, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err) {
      console.error("Failed to update profile:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to update profile" });
    }
  });

  return router;
}

module.exports = createUsersRouter;
