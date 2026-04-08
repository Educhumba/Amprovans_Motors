const express = require("express");
const router = express.Router();

const agentController = require("../controllers/agentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

// Only admin should access these
router.post("/", authenticate, authorize("admin"), agentController.createAgent);

router.get("/", authenticate, authorize(["admin"]), agentController.getAgents);

router.put("/:id/status", authenticate, authorize("admin"), agentController.updateStatus);
router.get("/agents", authenticate, authorize("admin"), agentController.generateAgentsReport);

module.exports = router;