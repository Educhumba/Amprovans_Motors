// controllers/agentController.js
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendMail = require("../config/mail");
const userModel = require("../models/userModel");
const User = require("../models/User");
const { Op } = require("sequelize");

const agentController = {

  // CREATE AGENT
  createAgent: async (req, res) => {
    try {
      const { name, email, phone } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const existing = await User.findOne({ 
        where: {
            [Op.or]: [{ email }, { phone }]
        }
        });

        if (existing) {
            if (existing.email === email) return res.status(400).json({ error: "Email already exists" });
            if (existing.phone === phone) return res.status(400).json({ error: "Phone number already exists" });
        }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create agent
      const userId = await userModel.createAgent(
        name,
        email,
        phone,
        hashedPassword
      );

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await userModel.saveResetToken(userId, resetToken, expires);

      const resetLink = `http://localhost:5500/frontend/reset-password.html?token=${resetToken}`;

      // Send welcome email
      try {
        await sendMail(
            email,
            "Your Agent Account - Reset Password",
            `
            <h2>Welcome to Amprovans Motors</h2>
            <p>Your account has been created.</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p>Please reset your password using the link below:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>This link expires in 1 hour.</p>
            `
        );
        } catch (err) {
            console.error("Error sending email:", err.message);
            // Optionally: continue without failing the request
        }

      res.json({ message: "Agent created and email sent" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },

  // GET ALL AGENTS
  getAgents: async (req, res) => {
    try {
      const agents = await userModel.getAllAgents();
      res.json(agents);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  },

  // UPDATE STATUS
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      await userModel.updateAgentStatus(id, status);

      res.json({ message: "Status updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update status" });
    }
  }

};

module.exports = agentController;