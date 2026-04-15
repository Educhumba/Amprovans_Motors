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

            // ✅ SEND EMAIL
            if (email) {
                await sendMail(
                    email,
                    "Car Hire Request Received - Amprovans Motors",
                    `
                    <h2>Request Received</h2>
                    <p>Dear ${fullName},</p>

                    <p>Thank you for choosing <b>Amprovans Motors</b>.</p>

                    <p>Your hire request for:</p>
                    <ul>
                        <li><b>Vehicle:</b> ${carName}</li>
                        <li><b>Pick-up Date:</b> ${pickupDate}</li>
                        <li><b>Return Date:</b> ${returnDate}</li>
                        <li><b>Estimated Cost:</b> KSh ${Number(totalCost).toLocaleString()}</li>
                    </ul>

                    <p>Your request is currently <b>under review</b>.</p>

                    <p>Our team will contact you shortly to confirm availability and finalize the booking.</p>

                    <br>
                    <p>Best regards,<br><b>Amprovans Motors Team</b></p>
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

            // ✅ Mark car as BOOKED
            const car = await Car.findByPk(hire.car_id);
            if (car) {
                car.status = "booked";
                await car.save();
            }

            // ✅ SEND APPROVAL EMAIL
            if (hire.email) {
                await sendMail(
                    hire.email,
                    "Car Hire Approved - Amprovans Motors",
                    `
                    <h2>Booking Confirmed ✅</h2>
                    <p>Dear ${hire.full_name},</p>

                    <p>Your hire request has been <b>APPROVED</b>.</p>

                    <ul>
                        <li><b>Vehicle:</b> ${hire.car_name}</li>
                        <li><b>Pickup Date:</b> ${hire.pickup_date}</li>
                        <li><b>Return Date:</b> ${hire.return_date}</li>
                        <li><b>Total Cost:</b> KSh ${Number(hire.total_cost).toLocaleString()}</li>
                    </ul>

                    <p><b>Pickup Location:</b> ${hire.pickup_location}</p>

                    <p>Please bring your identification and arrive on time.</p>

                    <p>Late returns may attract additional charges.</p>

                    <br>
                    <p>Thank you for choosing us!</p>
                    <b>Amprovans Motors</b>
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

            // ✅ SEND REJECTION EMAIL
            if (hire.email) {
                await sendMail(
                    hire.email,
                    "Car Hire Request Update - Amprovans Motors",
                    `
                    <h2>Request Update ❌</h2>
                    <p>Dear ${hire.full_name},</p>

                    <p>Unfortunately, your hire request has been <b>REJECTED</b>.</p>

                    <p><b>Reason:</b> ${rejectionReason}</p>

                    <p>You may contact our team for further assistance or submit a new request.</p>

                    <br>
                    <p>We appreciate your interest.</p>
                    <b>Amprovans Motors</b>
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