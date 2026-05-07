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
                        <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:40px;">

                        <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                            <!-- Header -->
                            <div style="background:#111827; color:white; padding:25px; text-align:center;">
                            <h1 style="margin:0;">Amprovans Motors</h1>

                            <p style="margin-top:8px; opacity:0.9;">
                                Vehicle Submission Received
                            </p>
                            </div>

                            <!-- Body -->
                            <div style="padding:35px; color:#333; line-height:1.7;">

                            <h2 style="margin-top:0;">
                                Hello ${ownerName},
                            </h2>

                            <p>
                                Thank you for submitting your vehicle to
                                <strong>Amprovans Motors</strong>.
                            </p>

                            <p>
                                Your vehicle details have been successfully received
                                and are currently under review by our team.
                            </p>

                            <!-- Vehicle Details -->
                            <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:20px; border-radius:8px; margin:25px 0;">

                                <p><strong>Vehicle:</strong> ${make} ${model} (${year})</p>

                                <p><strong>Plate Number:</strong> ${plateNumber}</p>

                                <p><strong>Transmission:</strong> ${transmission}</p>

                                <p><strong>Fuel Type:</strong> ${fuelType}</p>

                                <p><strong>Expected Price:</strong> KSh ${Number(expectedPrice).toLocaleString()}</p>

                            </div>

                            <p>
                                Once the review process is complete:
                            </p>

                            <ul>
                                <li>Your car may be approved and listed on our platform</li>
                                <li>Or you may receive feedback if additional review is required</li>
                            </ul>

                            <p>
                                We appreciate your trust in our services.
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

            // ======================
            // SEND APPROVAL EMAIL
            // ======================
            if (clientCar.owner_email) {
                try {
                    await sendMail(
                        clientCar.owner_email,
                        "Your Car Has Been Approved for Listing – Amprovans Motors",
                        `
                        <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:40px;">

                        <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                            <!-- Header -->
                            <div style="background:#16a34a; color:white; padding:25px; text-align:center;">
                            <h1 style="margin:0;">
                                Vehicle Approved
                            </h1>

                            <p style="margin-top:8px; opacity:0.9;">
                                Your Vehicle Has Been Approved For Listing
                            </p>
                            </div>

                            <!-- Body -->
                            <div style="padding:35px; color:#333; line-height:1.7;">

                            <h2 style="margin-top:0;">
                                Hello ${clientCar.owner_name},
                            </h2>

                            <p>
                                We are pleased to inform you that your vehicle
                                has been successfully approved for listing
                                on the <strong>Amprovans Motors</strong> platform.
                            </p>

                            <!-- Vehicle Details -->
                            <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:20px; border-radius:8px; margin:25px 0;">

                                <p>
                                <strong>Vehicle:</strong>
                                ${clientCar.make} ${clientCar.model} (${clientCar.year})
                                </p>

                                <p>
                                <strong>Plate Number:</strong>
                                ${clientCar.plate_number}
                                </p>

                                <p>
                                <strong>Approved Listing Price:</strong>
                                KSh ${Number(agreedPrice).toLocaleString()}
                                </p>

                            </div>

                            <p>
                                Your vehicle is now visible to potential buyers
                                and our sales team will actively assist in finding
                                interested customers.
                            </p>

                            <p>
                                We appreciate the opportunity to work with you.
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
                } catch (err) {
                    console.error("Approval email failed:", err.message);
                }
            }

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

            // ======================
            // SEND REJECTION EMAIL
            // ======================
            if (clientCar.owner_email) {
                try {
                    await sendMail(
                        clientCar.owner_email,
                        "Update on Your Car Submission – Amprovans Motors",
                        `
                        <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:40px;">

                        <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                            <!-- Header -->
                            <div style="background:#dc2626; color:white; padding:25px; text-align:center;">
                            <h1 style="margin:0;">
                                Vehicle Submission Update
                            </h1>

                            <p style="margin-top:8px; opacity:0.9;">
                                Review Outcome Notification
                            </p>
                            </div>

                            <!-- Body -->
                            <div style="padding:35px; color:#333; line-height:1.7;">

                            <h2 style="margin-top:0;">
                                Hello ${clientCar.owner_name},
                            </h2>

                            <p>
                                Thank you for submitting your vehicle to
                                <strong>Amprovans Motors</strong>.
                            </p>

                            <p>
                                After careful review, we regret to inform you that
                                your vehicle submission was not approved for listing
                                at this time.
                            </p>

                            <!-- Vehicle Details -->
                            <div style="background:#fef2f2; border:1px solid #fecaca; padding:20px; border-radius:8px; margin:25px 0;">

                                <p>
                                <strong>Vehicle:</strong>
                                ${clientCar.make} ${clientCar.model}
                                </p>

                                <p>
                                <strong>Plate Number:</strong>
                                ${clientCar.plate_number}
                                </p>

                                <p>
                                <strong>Reason:</strong>
                                ${rejectionReason}
                                </p>

                            </div>

                            <p>
                                You are welcome to make improvements and
                                resubmit your vehicle in the future.
                            </p>

                            <p>
                                We appreciate your interest and understanding.
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
                } catch (err) {
                    console.error("Rejection email failed:", err.message);
                }
            }

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