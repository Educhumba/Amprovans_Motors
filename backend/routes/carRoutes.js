const express = require("express");
const router = express.Router();
const carController = require("../controllers/carController");
const multer = require("multer");
const path = require("path");
const { authenticate, authorize } = require("../middleware/authMiddleware");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get("/public", carController.getCars);
// Routes with RBAC
router.post("/", authenticate, authorize("admin"), upload.array("images", 10), carController.addCar);
router.get("/", authenticate, authorize(["admin", "agent"]), carController.getCars);
router.put("/:id", authenticate, authorize("admin"), upload.array("images", 10), carController.updateCar);
router.put("/:id/status", authenticate, authorize("admin"), carController.updateStatus);
router.delete("/:id", authenticate, authorize("admin"), carController.deleteCar);
router.delete("/images/:id",  authenticate,  authorize("admin"), carController.deleteImage);

module.exports = router;