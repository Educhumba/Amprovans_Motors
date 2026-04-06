const router = require("express").Router();
const { login, register, requestReset, confirmReset } = require("../controllers/authController");

// REGISTER
router.post("/register", register);

// LOGIN
router.post("/login", login);

// PASSWORD RESET
router.post("/admin/request-reset", requestReset);
router.post("/admin/confirm-reset", confirmReset);

module.exports = router;