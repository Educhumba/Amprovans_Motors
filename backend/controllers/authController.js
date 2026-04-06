const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const sendMail = require("../config/mail");

// =====================
// REGISTER NEW USER
// =====================
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verification_code = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "agent",
      status: "active",
      is_verified: 0,
      verification_code
    });

    // Optional: send verification email
    // await sendMail(email, "Verify Your Account", `<p>Your code: <b>${verification_code}</b></p>`);

    res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// =====================
// LOGIN EXISTING USER
// =====================
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.status !== "active") return res.status(403).json({ error: "Account inactive or suspended" });
    if (!user.is_verified) return res.status(403).json({ error: "Please verify your email" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: "12h" });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// =====================
// PASSWORD RESET REQUEST
// =====================
exports.requestReset = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "User not found" });

    const reset_code = Math.floor(100000 + Math.random() * 900000).toString();
    const reset_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.reset_code = reset_code;
    user.reset_expires = reset_expires;
    await user.save();

    await sendMail(email, "Password Reset Code", `<p>Your password reset code is: <b>${reset_code}</b></p><p>It expires in 15 minutes.</p>`);

    res.json({ message: "Reset code sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// CONFIRM PASSWORD RESET
// =====================
exports.confirmReset = async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ where: { email, reset_code: code } });
    if (!user) return res.status(400).json({ message: "Invalid code or email" });

    if (!user.reset_expires || user.reset_expires < new Date())
      return res.status(400).json({ message: "Reset code expired" });

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear reset code and expiry
    user.reset_code = null;
    user.reset_expires = null;

    // ✅ Mark email as verified if not already
    if (!user.is_verified) {
      user.is_verified = true;
    }

    await user.save();

    res.json({ message: "Password reset successful. Email verified." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};