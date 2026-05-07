const { CarHire, Car } = require("../models");
const sendMail = require("../config/mail");
const PDFDocument = require("pdfkit-table");
const moment = require("moment");

const carHireController = {

    // =========================
    // SUBMIT HIRE REQUEST
    // =========================
    submitHire: async (req, res) => {
        try {
            const {
                fullName,
                phone,
                email,
                carId,
                carName,
                dailyRate,
                totalCost,
                pickupDate,
                returnDate,
                pickupLocation,
                notes
            } = req.body;

            // Calculate total days (backend safety)
            const start = new Date(pickupDate);
            const end = new Date(returnDate);
            const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

            if (totalDays <= 0) {
                return res.status(400).json({ message: "Invalid date range" });
            }

            const hire = await CarHire.create({
                full_name: fullName,
                phone,
                email,
                car_id: carId,
                car_name: carName,
                daily_rate: dailyRate,
                total_cost: totalCost,
                total_days: totalDays,
                pickup_date: pickupDate,
                return_date: returnDate,
                pickup_location: pickupLocation,
                notes
            });

            // SEND EMAIL
            if (email) {
                await sendMail(
                    email,
                    "Car Hire Request Received - Amprovans Motors",
                    `
                    <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:40px;">

                    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                        <!-- Header -->
                        <div style="background:#111827; color:white; padding:25px; text-align:center;">
                        <h1 style="margin:0;">Amprovans Motors</h1>
                        <p style="margin-top:8px; opacity:0.9;">
                            Car Hire Request Received
                        </p>
                        </div>

                        <!-- Body -->
                        <div style="padding:35px; color:#333; line-height:1.7;">

                        <h2 style="margin-top:0;">Hello ${fullName},</h2>

                        <p>
                            Thank you for choosing
                            <strong>Amprovans Motors</strong>.
                        </p>

                        <p>
                            We have successfully received your vehicle hire request.
                            Our team is currently reviewing your booking details and
                            vehicle availability.
                        </p>

                        <!-- Booking Details -->
                        <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:20px; border-radius:8px; margin:25px 0;">

                            <p><strong>Vehicle:</strong> ${carName}</p>

                            <p><strong>Pickup Date:</strong> ${pickupDate}</p>

                            <p><strong>Return Date:</strong> ${returnDate}</p>

                            <p><strong>Pickup Location:</strong> ${pickupLocation}</p>

                            <p><strong>Estimated Cost:</strong> KSh ${Number(totalCost).toLocaleString()}</p>

                        </div>

                        <p>
                            You will receive another email once your request
                            has been reviewed and approved.
                        </p>

                        <p>
                            If you have any questions, feel free to contact our support team.
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

            res.status(201).json({
                message: "Hire request submitted successfully",
                hire
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to submit hire request", error: error.message });
        }
    },

    // =========================
    // ADMIN: GET ALL REQUESTS
    // =========================
    getAllHires: async (req, res) => {
        try {
            const hires = await CarHire.findAll({
                order: [["createdAt", "DESC"]]
            });

            res.status(200).json(hires);
        } catch (err) {
            res.status(500).json({ message: "Failed to fetch hires", error: err.message });
        }
    },

    // =========================
    // APPROVE HIRE
    // =========================
    approveHire: async (req, res) => {
        try {
            const hireId = req.params.id;
            const { adminId } = req.body;

            const hire = await CarHire.findByPk(hireId);
            if (!hire) return res.status(404).json({ message: "Hire not found" });

            hire.status = "approved";
            hire.approved_by = adminId;
            hire.approved_at = new Date();
            await hire.save();

            // Mark car as BOOKED
            const car = await Car.findByPk(hire.car_id);
            if (car) {
                car.status = "booked";
                await car.save();
            }

            // SEND APPROVAL EMAIL
            if (hire.email) {
                await sendMail(
                    hire.email,
                    "Car Hire Approved - Amprovans Motors",
                    `
                    <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:40px;">

                    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                        <!-- Header -->
                        <div style="background:#16a34a; color:white; padding:25px; text-align:center;">
                        <h1 style="margin:0;">Booking Approved</h1>

                        <p style="margin-top:8px; opacity:0.9;">
                            Your Vehicle Reservation Has Been Confirmed
                        </p>
                        </div>

                        <!-- Body -->
                        <div style="padding:35px; color:#333; line-height:1.7;">

                        <h2 style="margin-top:0;">Hello ${hire.full_name},</h2>

                        <p>
                            We are pleased to inform you that your
                            vehicle hire request has been
                            <strong>approved successfully</strong>.
                        </p>

                        <!-- Booking Details -->
                        <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:20px; border-radius:8px; margin:25px 0;">

                            <p><strong>Vehicle:</strong> ${hire.car_name}</p>

                            <p><strong>Pickup Date:</strong> ${hire.pickup_date}</p>

                            <p><strong>Return Date:</strong> ${hire.return_date}</p>

                            <p><strong>Pickup Location:</strong> ${hire.pickup_location}</p>

                            <p><strong>Total Cost:</strong> KSh ${Number(hire.total_cost).toLocaleString()}</p>

                        </div>

                        <p>
                            Please ensure you arrive on time with valid identification
                            documents during pickup.
                        </p>

                        <p>
                            Late returns may attract additional charges
                            according to company policy.
                        </p>

                        <br>

                        <p>
                            Thank you for choosing
                            <strong>Amprovans Motors</strong>.
                        </p>

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

            res.status(200).json({ message: "Hire approved and car booked" });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to approve hire", error: err.message });
        }
    },

    // =========================
    // REJECT HIRE
    // =========================
    rejectHire: async (req, res) => {
        try {
            const hireId = req.params.id;
            const { rejectionReason, adminId } = req.body;

            const hire = await CarHire.findByPk(hireId);
            if (!hire) return res.status(404).json({ message: "Hire not found" });

            hire.status = "rejected";
            hire.rejection_reason = rejectionReason;
            hire.approved_by = adminId;
            hire.approved_at = new Date();

            await hire.save();

            // SEND REJECTION EMAIL
            if (hire.email) {
                await sendMail(
                    hire.email,
                    "Car Hire Request Update - Amprovans Motors",
                    `
                    <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:40px;">

                    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                        <!-- Header -->
                        <div style="background:#dc2626; color:white; padding:25px; text-align:center;">
                        <h1 style="margin:0;">Hire Request Update</h1>

                        <p style="margin-top:8px; opacity:0.9;">
                            Request Status Notification
                        </p>
                        </div>

                        <!-- Body -->
                        <div style="padding:35px; color:#333; line-height:1.7;">

                        <h2 style="margin-top:0;">Hello ${hire.full_name},</h2>

                        <p>
                            Thank you for your interest in
                            <strong>Amprovans Motors</strong>.
                        </p>

                        <p>
                            After reviewing your request, we regret to inform you
                            that your vehicle hire request was not approved at this time.
                        </p>

                        <!-- Reason -->
                        <div style="background:#fef2f2; border:1px solid #fecaca; padding:20px; border-radius:8px; margin:25px 0;">

                            <p style="margin:0;">
                            <strong>Reason:</strong> ${rejectionReason}
                            </p>

                        </div>

                        <p>
                            You may contact our support team for clarification
                            or submit another request in the future.
                        </p>

                        <p>
                            We appreciate your understanding and hope to serve you again.
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

            res.status(200).json({ message: "Hire rejected" });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to reject hire", error: err.message });
        }
    },

    // =========================
    // GENERATE HIRE REPORT
    // =========================
    generateHireReport: async (req, res) => {
        try {
            const { status } = req.query;

            const where = {};

            // Filter by status
            if (status && status !== "all") {
                where.status = status;
            }

            const hires = await CarHire.findAll({
                where,
                order: [["createdAt", "DESC"]]
            });

            // ======================
            // CALCULATIONS
            // ======================
            const totalRequests = hires.length;

            const totalRevenue = hires
                .filter(h => h.status === "approved")
                .reduce((sum, h) => sum + Number(h.total_cost || 0), 0);

            const pendingCount = hires.filter(h => h.status === "pending").length;
            const approvedCount = hires.filter(h => h.status === "approved").length;
            const rejectedCount = hires.filter(h => h.status === "rejected").length;

            // ======================
            // PDF SETUP
            // ======================
            const doc = new PDFDocument({
                margin: 30,
                size: "A4",
                layout: "landscape"
            });

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=car-hire-report-${Date.now()}.pdf`
            );

            doc.pipe(res);

            // ======================
            // TITLE
            // ======================
            doc.fontSize(18).text("Car Hire Requests Report", { align: "center" });

            doc.moveDown();

            doc
                .fontSize(10)
                .text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`);

            doc.moveDown();

            // ======================
            // FILTER INFO
            // ======================
            doc.fontSize(12).text("Filtered as:");
            doc.fontSize(10);

            doc.text(`Status: ${status || "All"}`);

            doc.moveDown();

            // ======================
            // TABLE
            // ======================
            doc.fontSize(14).text("Hire Requests", { underline: true });
            doc.moveDown();

            const table = {
                headers: [
                    "Name",
                    "Phone",
                    "Car",
                    "Days",
                    "Daily Rate(KSh)",
                    "Total Cost(KSh)",
                    "Pickup Date",
                    "Return Date",
                    "Location",
                    "Status"
                ],

                rows: hires.map(h => [
                    h.full_name,
                    h.phone,
                    h.car_name,
                    h.total_days,
                    Number(h.daily_rate).toLocaleString(),
                    Number(h.total_cost).toLocaleString(),
                    moment(h.pickup_date).format("YYYY-MM-DD"),
                    moment(h.return_date).format("YYYY-MM-DD"),
                    h.pickup_location,
                    h.status
                ])
            };

            // Totals row
            table.rows.push([
                "TOTAL",
                "",
                "",
                "",
                "",
                totalRevenue.toLocaleString(),
                "",
                "",
                "",
                ""
            ]);

            doc.table(table, {
                columnsSize: [100, 80, 120, 40, 80, 80, 90, 90, 80, 90],
                prepareHeader: () =>
                    doc.font("Helvetica-Bold").fontSize(9),

                prepareRow: (row, i) => {
                    doc.font("Helvetica").fontSize(8);

                    // Bold last row (totals)
                    if (i === table.rows.length - 1) {
                        doc.font("Helvetica-Bold");
                    }
                }
            });

            // ======================
            // SUMMARY
            // ======================
            doc.moveDown(2);

            doc.font("Helvetica-Bold").fontSize(12).text("Summary");
            doc.moveDown();

            doc.font("Helvetica").fontSize(10);

            doc.font("Helvetica-Bold").text("Total Requests: ", { continued: true })
                .font("Helvetica").text(totalRequests);

            doc.font("Helvetica-Bold").text("Pending: ", { continued: true })
                .font("Helvetica").text(pendingCount);

            doc.font("Helvetica-Bold").text("Approved: ", { continued: true })
                .font("Helvetica").text(approvedCount);

            doc.font("Helvetica-Bold").text("Rejected: ", { continued: true })
                .font("Helvetica").text(rejectedCount);

            doc.moveDown();

            doc.font("Helvetica-Bold").text("Total Revenue (Approved Only): ", { continued: true })
                .font("Helvetica").text(`KSh ${totalRevenue.toLocaleString()}`);

            doc.end();

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to generate hire report" });
        }
    }
};

module.exports = carHireController;