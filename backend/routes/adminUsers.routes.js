const express = require("express");
const bcrypt = require("bcrypt");
const createRequireAuth = require("../middlewares/requireAuth");

const SALT_ROUNDS = 12;

function parseId(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${fieldName} must be a positive integer` };
  }
  return { value: parsed };
}

function createAdminUsersRouter(db) {
  const router = express.Router();
  const requireAuth = createRequireAuth(db);
  const staffRoles = ["admin", "manager", "courier"];

  const requireAdmin = (req, res) => {
    const role = Number(req.user?.role);
    if (role !== 1) {
      res.status(403).json({ ok: false, message: "Forbidden" });
      return false;
    }
    return true;
  };

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

  router.get("/users", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      const rows = await query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.phone,
          u.address,
          u.role,
          u.is_active,
          r.role AS role_name
        FROM users u
        LEFT JOIN user_role r ON r.id = u.role
        WHERE r.role IN (?, ?, ?)
        ORDER BY u.id ASC
        `,
        staffRoles
      );

      const users = (rows || []).map((row) => ({
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        role: row.role,
        is_active: row.is_active,
        role_name: row.role_name ?? null,
      }));

      return res.json({ items: users });
    } catch (err) {
      console.error("Failed to fetch users:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch users" });
    }
  });

  router.post("/users", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const fullNameRaw = req.body?.full_name ?? req.body?.name;
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

      const roleRows = await query(
        "SELECT id, role FROM user_role WHERE role = ? LIMIT 1",
        ["courier"]
      );
      const roleRow = roleRows?.[0];
      if (!roleRow || !staffRoles.includes(roleRow.role)) {
        await rollback();
        return res
          .status(500)
          .json({ ok: false, message: "Staff role not found" });
      }

      const idRows = await query("SELECT MAX(id) AS maxId FROM users FOR UPDATE");
      const nextId = Number(idRows?.[0]?.maxId ?? 0) + 1;

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      await query(
        "INSERT INTO users (id, full_name, email, phone, password, address, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [nextId, full_name, email, phone, passwordHash, address, roleRow.id, 1]
      );

      await commit();

      return res.status(201).json({
        user: {
          id: nextId,
          full_name,
          email,
          phone,
          address,
          role: roleRow.id,
          is_active: 1,
          role_name: roleRow.role,
        },
      });
    } catch (err) {
      await rollback();
      if (err?.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ ok: false, message: "Email already in use" });
      }
      console.error("Failed to create staff user:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to create staff user" });
    }
  });

  router.patch("/users/:id/role", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const userId = parseId(req.params.id, "id");
    if (userId.error) {
      return res.status(400).json({ ok: false, message: userId.error });
    }

    if (Number(req.user?.id) === Number(userId.value)) {
      return res
        .status(403)
        .json({ ok: false, message: "Cannot change own role" });
    }

    const roleId = parseId(req.body?.role, "role");
    if (roleId.error) {
      return res.status(400).json({ ok: false, message: roleId.error });
    }

    try {
      const targetRows = await query(
        `
        SELECT u.id, r.role AS role_name
        FROM users u
        LEFT JOIN user_role r ON r.id = u.role
        WHERE u.id = ?
        LIMIT 1
        `,
        [userId.value]
      );
      const targetUser = targetRows?.[0];
      if (!targetUser) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }
      if (!staffRoles.includes(targetUser.role_name)) {
        return res
          .status(403)
          .json({ ok: false, message: "Cannot edit non-staff user" });
      }

      const roleRows = await query(
        "SELECT id, role FROM user_role WHERE id = ? LIMIT 1",
        [roleId.value]
      );
      const roleRow = roleRows?.[0];
      if (!roleRow) {
        return res.status(404).json({ ok: false, message: "Role not found" });
      }
      if (!staffRoles.includes(roleRow.role)) {
        return res
          .status(400)
          .json({ ok: false, message: "Cannot assign client role" });
      }

      const result = await query("UPDATE users SET role = ? WHERE id = ?", [
        roleId.value,
        userId.value,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }

      const rows = await query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.phone,
          u.address,
          u.role,
          u.is_active,
          r.role AS role_name
        FROM users u
        LEFT JOIN user_role r ON r.id = u.role
        WHERE u.id = ?
        LIMIT 1
        `,
        [userId.value]
      );
      const user = rows?.[0];
      if (!user) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }

      return res.json({
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          is_active: user.is_active,
          role_name: user.role_name ?? null,
        },
      });
    } catch (err) {
      console.error("Failed to update user role:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to update user role" });
    }
  });

  router.patch("/users/:id/active", requireAuth, async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const userId = parseId(req.params.id, "id");
    if (userId.error) {
      return res.status(400).json({ ok: false, message: userId.error });
    }

    const rawActive = req.body?.is_active;
    let isActive = null;
    if (typeof rawActive === "boolean") {
      isActive = rawActive;
    } else if (rawActive === 0 || rawActive === 1) {
      isActive = Boolean(rawActive);
    } else if (typeof rawActive === "string") {
      if (rawActive === "0" || rawActive.toLowerCase() === "false") {
        isActive = false;
      } else if (rawActive === "1" || rawActive.toLowerCase() === "true") {
        isActive = true;
      }
    }

    if (isActive === null) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid is_active" });
    }

    if (!isActive && Number(req.user?.id) === Number(userId.value)) {
      return res
        .status(403)
        .json({ ok: false, message: "Cannot deactivate own account" });
    }

    try {
      const targetRows = await query(
        `
        SELECT u.id, r.role AS role_name
        FROM users u
        LEFT JOIN user_role r ON r.id = u.role
        WHERE u.id = ?
        LIMIT 1
        `,
        [userId.value]
      );
      const targetUser = targetRows?.[0];
      if (!targetUser) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }
      if (!staffRoles.includes(targetUser.role_name)) {
        return res
          .status(403)
          .json({ ok: false, message: "Cannot edit non-staff user" });
      }

      await query("UPDATE users SET is_active = ? WHERE id = ?", [
        isActive ? 1 : 0,
        userId.value,
      ]);

      const rows = await query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.phone,
          u.address,
          u.role,
          u.is_active,
          r.role AS role_name
        FROM users u
        LEFT JOIN user_role r ON r.id = u.role
        WHERE u.id = ?
        LIMIT 1
        `,
        [userId.value]
      );
      const user = rows?.[0];
      if (!user) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }

      return res.json({
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          is_active: user.is_active,
          role_name: user.role_name ?? null,
        },
      });
    } catch (err) {
      console.error("Failed to update user status:", err);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to update user status" });
    }
  });

  return router;
}

module.exports = createAdminUsersRouter;
