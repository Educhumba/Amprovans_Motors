// controllers/agentController.js
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendMail = require("../config/mail");
const userModel = require("../models/userModel");
const User = require("../models/User");
const { Op } = require("sequelize");
const PDFDocument = require("pdfkit-table");
const moment = require("moment");

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
      const { status, verified } = req.query; // <-- accept query params

      let whereClause = { role: "agent" }; // only agents

      // Status filter
      if (status && ["active", "inactive", "suspended"].includes(status)) {
        whereClause.status = status;
      }

      // Verified filter
      if (verified && ["verified", "unverified"].includes(verified)) {
        whereClause.is_verified = verified === "verified";
      }

      const agents = await User.findAll({
        where: whereClause,
        order: [["created_at", "DESC"]]
      });

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
  },

  //Genarate agents report
generateAgentsReport: async (req, res) => {
  try {
    const { status, verified } = req.query;

    let whereClause = { role: "agent" };

    if (status && ["active", "inactive", "suspended"].includes(status)) {
      whereClause.status = status;
    }

    if (verified && ["verified", "unverified"].includes(verified)) {
      whereClause.is_verified = verified === "verified";
    }

    const agents = await User.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]]
    });

    // PDF setup
    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=agents_report.pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Agents Report", { align: "center" });
    doc.moveDown();

    // Prepare table
    const table = {
      headers: ["Name", "Email", "Phone", "Role", "Status", "Verified", "Date Added"],
      rows: agents.map(agent => [
        agent.name,
        agent.email,
        agent.phone,
        agent.role,
        agent.status,
        agent.is_verified ? "Yes" : "No",
        moment(agent.created_at).format("YYYY-MM-DD")
      ])
    };

    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(12),
      prepareRow: (row, i) => doc.font("Helvetica").fontSize(11)
    });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
}

};

module.exports = agentController;