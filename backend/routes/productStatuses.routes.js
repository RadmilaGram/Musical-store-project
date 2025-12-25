const express = require("express");

const success = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const errorResponse = (res, status, message, details) => {
  const payload = { success: false, message };
  if (details) {
    payload.details = details;
  }
  return res.status(status).json(payload);
};

function createProductStatusesRouter(db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    db.query(
      "SELECT id, name FROM product_status ORDER BY id ASC",
      (err, results) => {
        if (err) {
          console.error("Failed to fetch product statuses:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch product statuses",
            err.message
          );
        }
        return success(res, results);
      }
    );
  });

  return router;
}

module.exports = createProductStatusesRouter;
