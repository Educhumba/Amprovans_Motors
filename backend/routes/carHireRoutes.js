const express = require("express");
const router = express.Router();

const {
    submitHire,
    getAllHires,
    approveHire,
    rejectHire,
    generateHireReport
} = require("../controllers/carHireController");

// Submit hire request
router.post("/", submitHire);

// Admin routes
router.get("/admin", getAllHires);
router.patch("/admin/:id/approve", approveHire);
router.patch("/admin/:id/reject", rejectHire);
// EXPORT PDF REPORT
router.get("/admin/export", generateHireReport);

module.exports = router;