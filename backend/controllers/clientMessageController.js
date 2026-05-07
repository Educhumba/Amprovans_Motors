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
                    <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:40px;">

                    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                        <!-- Header -->
                        <div style="background:#111827; color:white; padding:25px; text-align:center;">
                        <h1 style="margin:0;">Amprovans Motors</h1>

                        <p style="margin-top:8px; opacity:0.9;">
                            Message Received Successfully
                        </p>
                        </div>

                        <!-- Body -->
                        <div style="padding:35px; color:#333; line-height:1.7;">

                        <h2 style="margin-top:0;">
                            Hello ${name},
                        </h2>

                        <p>
                            Thank you for contacting
                            <strong>Amprovans Motors</strong>.
                        </p>

                        <p>
                            We have successfully received your message and
                            our support team will review it shortly.
                        </p>

                        <!-- Message Box -->
                        <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:20px; border-radius:8px; margin:25px 0;">

                            <p style="margin-top:0;">
                            <strong>Your Message:</strong>
                            </p>

                            <p style="margin-bottom:0; color:#374151;">
                            ${message}
                            </p>

                        </div>

                        <p>
                            We aim to respond to all customer inquiries
                            as quickly as possible.
                        </p>

                        <p>
                            If your inquiry is urgent, please contact us directly
                            through our official phone channels.
                        </p>

                        <br>

                        <p>
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