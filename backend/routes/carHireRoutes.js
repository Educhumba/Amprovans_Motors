const express = require("express");
const router = express.Router();

const {
    submitHire,
    getAllHires,
    approveHire,
    rejectHire
} = require("../controllers/carHireController");

// Submit hire request
router.post("/", submitHire);

// Admin routes
router.get("/admin", getAllHires);
router.patch("/admin/:id/approve", approveHire);
router.patch("/admin/:id/reject", rejectHire);

module.exports = router;