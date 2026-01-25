function createRequireAuth(db) {
  return function requireAuth(req, res, next) {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    db.query("SELECT * FROM users WHERE id = ? LIMIT 1", [userId], (err, rows) => {
      if (err) {
        console.error("Failed to load user:", err);
        return res.status(500).json({ ok: false, message: "Unauthorized" });
      }
      const user = rows?.[0];
      if (!user) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
      }
      const { password, password_hash, ...safeUser } = user;
      req.user = safeUser;
      return next();
    });
  };
}

module.exports = createRequireAuth;
