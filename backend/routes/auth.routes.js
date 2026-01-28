const express = require("express");
const bcrypt = require("bcrypt");
const createRequireAuth = require("../middlewares/requireAuth");

const SALT_ROUNDS = 12;
const CLIENT_ROLE_ID = 2;

function createAuthRouter(db) {
  const router = express.Router();
  const requireAuth = createRequireAuth(db);

  router.get("/me", requireAuth, (req, res) => {
    return res.json({ user: req.user });
  });

  router.post("/register", async (req, res) => {
    const fullNameRaw = req.body?.full_name;
    const emailRaw = req.body?.email;
    const phoneRaw = req.body?.phone;
    const addressRaw = req.body?.address;
    const passwordRaw = req.body?.password;

    const full_name =
      typeof fullNameRaw === "string" ? fullNameRaw.trim() : "";
    const email = typeof emailRaw === "string" ? emailRaw.trim() : "";
    const phone = typeof phoneRaw === "string" ? phoneRaw.trim() : "";
    const address = typeof addressRaw === "string" ? addressRaw.trim() : "";
    const password = typeof passwordRaw === "string" ? passwordRaw : "";

    if (!full_name || !email || !phone || !address || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing required fields" });
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

      const existingRows = await query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email]
      );
      if (existingRows.length > 0) {
        await rollback();
        return res
          .status(409)
          .json({ ok: false, message: "Email already in use" });
      }

      const idRows = await query("SELECT MAX(id) AS maxId FROM users FOR UPDATE");
      const nextId = Number(idRows?.[0]?.maxId ?? 0) + 1;

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      await query(
        "INSERT INTO users (id, full_name, email, phone, password, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nextId, full_name, email, phone, passwordHash, address, CLIENT_ROLE_ID]
      );

      await commit();

      req.session.userId = nextId;
      return res.json({
        user: {
          id: nextId,
          full_name,
          email,
          phone,
          address,
          role: CLIENT_ROLE_ID,
        },
      });
    } catch (err) {
      await rollback();
      console.error("Failed to register user:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to register user" });
    }
  });

  router.post("/change-password", requireAuth, async (req, res) => {
    const currentRaw = req.body?.current_password;
    const newRaw = req.body?.new_password;
    const current_password = typeof currentRaw === "string" ? currentRaw : "";
    const new_password = typeof newRaw === "string" ? newRaw : "";

    if (!current_password || !new_password) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing required fields" });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    try {
      const userRows = await query(
        "SELECT id, password FROM users WHERE id = ? LIMIT 1",
        [req.user?.id]
      );
      const user = userRows?.[0];
      if (!user) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }

      const ok = await bcrypt.compare(current_password, user.password);
      if (!ok) {
        return res
          .status(401)
          .json({ ok: false, message: "Invalid current password" });
      }

      const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);
      await query("UPDATE users SET password = ? WHERE id = ?", [
        passwordHash,
        user.id,
      ]);

      req.session.destroy(() => {
        res.clearCookie("sid");
        return res.json({ ok: true });
      });
    } catch (err) {
      console.error("Failed to change password:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to change password" });
    }
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("sid");
      return res.json({ ok: true });
    });
  });

  return router;
}

module.exports = createAuthRouter;
