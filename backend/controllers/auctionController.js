const { ClientCar, Car, CarImage } = require("../models");
const sendMail = require("../config/mail");
const PDFDocument = require("pdfkit-table");
const moment = require("moment");

const auctionController = {
    // Submit car
    submitCar: async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: "No images uploaded" });
            }
            const imageUrls = req.files.map(file => file.path);

            const {
                ownerName,
                ownerPhone,
                ownerEmail,
                plateNumber,
                make,
                model,
                year,
                mileage,
                engine,
                transmission,
                fuelType,
                body,
                condition,
                color,
                location,
                expectedPrice,
                description
            } = req.body;
            const newCar = await ClientCar.create({
                owner_name: ownerName,
                owner_phone: ownerPhone,
                owner_email: ownerEmail,
                plate_number: plateNumber,
                make,
                model,
                year,
                mileage,
                engine,
                transmission,
                fuel_type: fuelType,
                body,
                condition,
                color,
                location,
                expected_price: expectedPrice,
                description,
                images: imageUrls
            });

            // Send confirmation email
            if (ownerEmail) {
                try {
                    await sendMail(
                        ownerEmail,
                        "Car Submission Received - Amprovans Motors",
                        `
                        <h2>Thank you for your submission!</h2>
                        <p>Dear ${ownerName},</p>
                        <p>Your car (<b>${make} ${model}</b>, Plate: <b>${plateNumber}</b>) has been successfully submitted.</p>
                        <p>Our team is currently reviewing your submission.</p>
                        <h3>What happens next?</h3>
                        <ul>
                            <li>✔ If approved → Your car will be listed on our platform</li>
                            <li>✔ If rejected → We will notify you with the reason</li>
                        </ul>
                        <p>We will contact you soon.</p>
                        <br>
                        <p>Best regards,<br>Amprovans Motors Team</p>
                        `
                    );
                } catch (err) {
                    console.error("Email failed:", err.message);
                }
            }
            res.status(201).json({ message: "Car submitted successfully. Confirmation email sent." });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Submission failed", error: error.message });
        }
    },

    // Fetch pending cars
    getPendingCars: async (req, res) => {
        try {
            const pendingCars = await ClientCar.findAll({
                where: { status: "pending" },
                order: [["createdAt", "DESC"]]
            });

            res.status(200).json(pendingCars);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to fetch pending cars", error: err.message });
        }
    },

    // Approve car
    approveCar: async (req, res) => {
        try {
            const carId = req.params.id;
            const { agreedPrice, adminId } = req.body;

            const clientCar = await ClientCar.findByPk(carId);
            if (!clientCar) return res.status(404).json({ message: "Client car not found" });

            const commissionRate = 0.08;
            const commissionAmount = agreedPrice * commissionRate;

            // Insert into Cars table
            const newCar = await Car.create({
                plate_number: clientCar.plate_number,
                make: clientCar.make,
                model: clientCar.model,
                year: clientCar.year,
                transmission: clientCar.transmission,
                fuel: clientCar.fuel_type,
                body: clientCar.body,
                condition: clientCar.condition,
                color: clientCar.color,
                mileage: clientCar.mileage || 0,
                engine: clientCar.engine || 0,
                location: clientCar.location,
                price: agreedPrice,
                cost: 0,
                ownership: "client",
                status: "available",
                description: clientCar.description,
                updated_by: adminId
            });

            // Copy images
            for (const img of clientCar.images) {
                await CarImage.create({
                    car_id: newCar.id,
                    image_path: img
                });
            }

            // Update client car
            clientCar.status = "approved";
            clientCar.agreed_price = agreedPrice;
            clientCar.commission_rate = commissionRate;
            clientCar.commission_amount = commissionAmount;
            clientCar.reviewed_by = adminId;
            clientCar.reviewed_at = new Date();

            await clientCar.save();

            res.status(200).json({ message: "Car approved and listed successfully", car: newCar });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to approve car", error: err.message });
        }
    },

    // Reject car
    rejectCar: async (req, res) => {
        try {
            const carId = req.params.id;
            const { rejectionReason, adminId } = req.body;

            const clientCar = await ClientCar.findByPk(carId);
            if (!clientCar) return res.status(404).json({ message: "Client car not found" });

            clientCar.status = "rejected";
            clientCar.rejection_reason = rejectionReason;
            clientCar.reviewed_by = adminId;
            clientCar.reviewed_at = new Date();

            await clientCar.save();

            res.status(200).json({ message: "Car rejected successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to reject car", error: err.message });
        }
    },

    // =========================
    // GENERATE AUCTION REPORT
    // =========================
    generateAuctionReport: async (req, res) => {
        try {

            // Get ALL submissions (not just pending)
            const cars = await ClientCar.findAll({
                order: [["createdAt", "DESC"]]
            });

            // ======================
            // CALCULATIONS
            // ======================
            const totalRequests = cars.length;

            const pendingCount = cars.filter(c => c.status === "pending").length;
            const approvedCount = cars.filter(c => c.status === "approved").length;
            const rejectedCount = cars.filter(c => c.status === "rejected").length;

            const totalExpectedValue = cars.reduce(
                (sum, c) => sum + Number(c.expected_price || 0),
                0
            );

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
                `attachment; filename=auction-report-${Date.now()}.pdf`
            );

            doc.pipe(res);

            // ======================
            // TITLE
            // ======================
            doc.fontSize(18).text("Car Auction Requests Report", { align: "center" });

            doc.moveDown();

            doc
                .fontSize(10)
                .text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`);

            doc.moveDown();

            // ======================
            // TABLE TITLE
            // ======================
            doc.fontSize(14).text("Submitted Cars", { underline: true });
            doc.moveDown();

            // ======================
            // TABLE
            // ======================
            const table = {
                headers: [
                    "Car",
                    "Plate",
                    "Owner",
                    "Phone",
                    "Email",
                    "Mileage",
                    "Transmission",
                    "Fuel",
                    "Expected Price (KSh)"
                ],

                rows: cars.map(c => [
                    `${c.make} ${c.model} (${c.year})`,
                    c.plate_number,
                    c.owner_name,
                    c.owner_phone,
                    c.owner_email || "-",
                    c.mileage || "N/A",
                    c.transmission,
                    c.fuel_type,
                    Number(c.expected_price || 0).toLocaleString()
                ])
            };

            // Totals row
            table.rows.push([
                "TOTAL",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                totalExpectedValue.toLocaleString()
            ]);

            doc.table(table, {
                columnsSize: [140, 70, 90, 70, 140, 60, 80, 60, 110],
                prepareHeader: () =>
                    doc.font("Helvetica-Bold").fontSize(9),

                prepareRow: (row, i) => {
                    doc.font("Helvetica").fontSize(8);

                    // Bold totals row
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

            doc.font("Helvetica-Bold").text("Total Submissions: ", { continued: true })
                .font("Helvetica").text(totalRequests);

            doc.font("Helvetica-Bold").text("Pending: ", { continued: true })
                .font("Helvetica").text(pendingCount);

            doc.font("Helvetica-Bold").text("Approved: ", { continued: true })
                .font("Helvetica").text(approvedCount);

            doc.font("Helvetica-Bold").text("Rejected: ", { continued: true })
                .font("Helvetica").text(rejectedCount);

            doc.moveDown();

            doc.font("Helvetica-Bold").text("Total Expected Value: ", { continued: true })
                .font("Helvetica").text(`KSh ${totalExpectedValue.toLocaleString()}`);

            doc.end();

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to generate auction report" });
        }
    }
};

module.exports = auctionController;