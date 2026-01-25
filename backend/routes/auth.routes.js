const express = require("express");
const createRequireAuth = require("../middlewares/requireAuth");

function createAuthRouter(db) {
  const router = express.Router();
  const requireAuth = createRequireAuth(db);

  router.get("/me", requireAuth, (req, res) => {
    return res.json({ user: req.user });
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
