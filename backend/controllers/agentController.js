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
            <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:40px;">

              <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background:#111827; color:white; padding:25px; text-align:center;">
                  <h1 style="margin:0;">Amprovans Motors</h1>
                  <p style="margin-top:8px; opacity:0.9;">
                    Agent Account Created Successfully
                  </p>
                </div>

                <!-- Body -->
                <div style="padding:35px; color:#333; line-height:1.7;">

                  <h2 style="margin-top:0;">Welcome ${name},</h2>

                  <p>
                    Your agent account has been successfully created on the
                    <strong>Amprovans Motors Management System</strong>.
                  </p>

                  <p>
                    Please use the temporary password below to access your account
                    and immediately reset your password for security purposes.
                  </p>

                  <!-- Credentials Box -->
                  <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:20px; border-radius:8px; margin:25px 0;">

                    <p style="margin:0 0 10px 0;">
                      <strong>Email:</strong> ${email}
                    </p>

                    <p style="margin:0;">
                      <strong>Temporary Password:</strong> ${tempPassword}
                    </p>

                  </div>

                  <!-- Button -->
                  <div style="text-align:center; margin:35px 0;">

                    <a href="${resetLink}"
                      style="
                        background:#2563eb;
                        color:white;
                        text-decoration:none;
                        padding:14px 28px;
                        border-radius:6px;
                        display:inline-block;
                        font-weight:bold;
                      ">
                      Reset Password
                    </a>

                  </div>

                  <p>
                    This password reset link will expire in
                    <strong>1 hour</strong>.
                  </p>

                  <p>
                    If you did not expect this account creation,
                    please contact the system administrator immediately.
                  </p>

                  <br>

                  <p style="margin-bottom:0;">
                    Regards,<br>
                    <strong>Amprovans Motors Team</strong>
                  </p>

                </div>

                <!-- Footer -->
                <div style="background:#f3f4f6; padding:18px; text-align:center; font-size:12px; color:#6b7280;">
                  © 2026 Amprovans Motors. All rights reserved.
                </div>

              </div>

            </div>

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

  // DELETE AGENT
  deleteAgent: async (req, res) => {
    try {

      const { id } = req.params;

      const agent = await User.findByPk(id);

      if (!agent) {
        return res.status(404).json({
          error: "Agent not found"
        });
      }

      await agent.destroy();

      res.json({
        message: "Agent deleted successfully"
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Failed to delete agent"
      });
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