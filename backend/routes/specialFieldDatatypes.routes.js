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

function createSpecialFieldDatatypesRouter(db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    db.query(
      "SELECT id, name FROM special_field_datatype ORDER BY id ASC",
      (err, results) => {
        if (err) {
          console.error("Failed to load special field datatypes:", err);
          return errorResponse(
            res,
            500,
            "Failed to fetch special field datatypes",
            err.message
          );
        }
        return success(res, results);
      }
    );
  });

  return router;
}

module.exports = createSpecialFieldDatatypesRouter;
