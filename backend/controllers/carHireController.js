const { CarHire, Car } = require("../models");
const sendMail = require("../config/mail");

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
    }
};

module.exports = carHireController;