const express = require("express");
const router = express.Router();

const clientUpload = require("../middleware/clientUploads");
const {
    submitCar,
    getPendingCars,
    approveCar,
    rejectCar
} = require("../controllers/auctionController");

// Submit car
router.post("/", clientUpload.array("images", 10), submitCar);

// Admin: fetch pending
router.get("/admin/pending", getPendingCars);

// Admin: approve
router.patch("/admin/:id/approve", approveCar);

// Admin: reject
router.patch("/admin/:id/reject", rejectCar);

module.exports = router;