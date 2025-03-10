const express = require("express");
const multer = require("multer");
const { uploadMedia, getALlMedia } = require("../controllers/media-controllers");
const { authenticateRequest } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

const router = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5 * 1024 * 1024,
  },
}).single("file");

router.post("/uploads", authenticateRequest, (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error while uploading", err);
        return res.status(400).json({
          message: "Multer error while uploading",
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error("Unknown error occured while uploading", err);
        return res.status(500).json({
          message: "Unknown error occured while uploading",
          error: err.message,
          stack: err.stack,
        });
      }
      if (!req.file) {
        logger.error("No file found", err);
        return res.status(400).json({
          message: "No file found",
        });
      }
      next()
    });
}, uploadMedia);

router.get("/get", authenticateRequest, getALlMedia)

module.exports = router
