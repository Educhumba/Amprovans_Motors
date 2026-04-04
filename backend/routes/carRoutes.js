const express = require("express");
const router = express.Router();
const carController = require("../controllers/carController");
const multer = require("multer");
const path = require("path");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post("/", upload.array("images", 10), carController.addCar);
router.get("/", carController.getCars);
router.put("/:id/status", carController.updateStatus);
router.delete("/:id", carController.deleteCar);

module.exports = router;