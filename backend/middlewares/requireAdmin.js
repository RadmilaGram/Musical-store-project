function requireAdmin(req, res, next) {
  if (Number(req.user?.role) !== 1) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  return next();
}

module.exports = requireAdmin;
