const express = require("express");
const router = express.Router();

const {
    submitMessage,
    getAllMessages,
    updateStatus
} = require("../controllers/clientMessageController");

// Public: submit message
router.post("/", submitMessage);

// Admin: fetch all messages
router.get("/admin", getAllMessages);

// Admin: update status (pending/resolved)
router.patch("/admin/:id/status", updateStatus);

module.exports = router;