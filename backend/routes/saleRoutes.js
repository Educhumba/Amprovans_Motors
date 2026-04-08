const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

// Agent & Admin can create sale
router.post("/", authenticate, authorize(["admin","agent"]), saleController.createSale);
// GET all sales (admin sees all, agent sees only theirs)
router.get("/", authenticate, authorize(["admin","agent"]), saleController.getAllSales);
router.get("/summary", authenticate, authorize(["admin","agent"]), saleController.getSalesSummary);
router.get("/report/pdf", authenticate, authorize(["admin"]), saleController.generateSalesReport);
router.get("/report/detailed", authenticate, authorize(["admin"]), saleController.generateDetailedSalesReport);

module.exports = router;