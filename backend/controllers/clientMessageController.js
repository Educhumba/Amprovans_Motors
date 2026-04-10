const ClientMessage = require("../models/ClientMessage");
const sendMail = require("../config/mail");

const clientMessageController = {

    // =========================
    // SUBMIT MESSAGE
    // =========================
    submitMessage: async (req, res) => {
        try {
            const { name, email, phone, message } = req.body;

            // Create message record
            const newMessage = await ClientMessage.create({ name, email, phone, message });

            // Send confirmation email to client
            if (email) {
                await sendMail(
                    email,
                    "Message Received - Amprovans Motors",
                    `
                    <h2>Hello ${name},</h2>
                    <p>Thank you for contacting <b>Amprovans Motors</b>.</p>
                    <p>We have received your message:</p>
                    <blockquote>${message}</blockquote>
                    <p>Our team will review your message and get back to you as soon as possible.</p>
                    <br>
                    <p>Best regards,<br><b>Amprovans Motors Team</b></p>
                    `
                );
            }

            res.status(201).json({ message: "Message submitted successfully", data: newMessage });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to submit message", error: err.message });
        }
    },

    // =========================
    // ADMIN: GET ALL MESSAGES
    // =========================
    getAllMessages: async (req, res) => {
        try {
            const messages = await ClientMessage.findAll({
                order: [["createdAt", "DESC"]]
            });
            res.status(200).json(messages);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to fetch messages", error: err.message });
        }
    },

    // =========================
    // ADMIN: UPDATE STATUS
    // =========================
    updateStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const message = await ClientMessage.findByPk(id);
            if (!message) return res.status(404).json({ message: "Message not found" });

            message.status = status;
            await message.save();

            res.status(200).json({ message: "Status updated successfully", data: message });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to update status", error: err.message });
        }
    }
};

module.exports = clientMessageController;