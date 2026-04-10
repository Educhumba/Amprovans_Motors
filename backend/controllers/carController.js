const { Car, CarImage } = require("../models");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit-table");
const moment = require("moment");
const { addPage } = require("pdfkit");

// =========================
// NORMALIZE PLATE NUMBER
// =========================
function normalizePlate(plate) {
  if (!plate) return plate;

  // remove spaces & dashes
  plate = plate.replace(/[\s-]/g, "").toUpperCase();

  // match Kenyan format
  const match = plate.match(/^([A-Z]{3})(\d{3})([A-Z])$/);

  if (match) {
    return `${match[1]} ${match[2]}${match[3]}`;
  }

  return plate.toUpperCase();
}

const carController = {

  // =========================
  // ADD CAR
  // =========================
  addCar: async (req, res) => {
    try {
      const {
        plate_number,make, model, year, transmission, fuel, body,
        condition, color, mileage, engine, location,
        price, cost, ownership, description
      } = req.body;

      const user = req.user;

      // ✅ VALIDATION
      if (!plate_number) {
        return res.status(400).json({ error: "Plate number required" });
      }

      const normalizedPlate = normalizePlate(plate_number);

      const existing = await Car.findOne({
        where: { plate_number: normalizedPlate }
      });

      if (existing) {
        return res.status(400).json({
          error: "Plate number already exists"
        });
      }
      if (!price || price <= 0) {
        return res.status(400).json({ error: "Invalid price" });
      }

      if (cost === undefined || cost < 0) {
        return res.status(400).json({ error: "Invalid cost" });
      }

      if (!["company", "client"].includes(ownership)) {
        return res.status(400).json({ error: "Invalid ownership type" });
      }

      // ✅ CREATE CAR
      const car = await Car.create({
        plate_number: normalizedPlate, make, model, year, transmission, fuel, body,
        condition, color, mileage, engine, location,
        price, cost, ownership,
        description,
        status: "available",
        updated_by: user.id
      });

      // ✅ HANDLE IMAGES
      if (req.files && req.files.length > 0) {
        const images = req.files.map(file => ({
          image_path: `/uploads/${file.filename}`,
          car_id: car.id
        }));
        await CarImage.bulkCreate(images);
      }

      res.json({ message: "Car added successfully", carId: car.id });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // =========================
  // GET CARS
  // =========================
  getCars: async (req, res) => {
    try {
      const cars = await Car.findAll({
        include: { model: CarImage, as: "images" }
      });
console.log(JSON.stringify(cars, null, 2)); // 👈 ADD THIS
      res.json(cars);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // =========================
  // UPDATE STATUS
  // =========================
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user;

      // ✅ Validate ENUM
      if (!["available", "booked", "sold"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const car = await Car.findByPk(id);

      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }

      // 🔴 Prevent overriding sold status manually
      if (car.status === "sold") {
        return res.status(400).json({ error: "Cannot change status of sold car" });
      }

      await car.update({
        status,
        updated_by: user.id
      });

      res.json({ message: "Status updated" });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // =========================
  // UPDATE CAR
  // =========================
  updateCar: async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const car = await Car.findByPk(id);

      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }

      // 🔴 Prevent editing sold cars
      if (car.status === "sold") {
        return res.status(400).json({ error: "Cannot edit a sold car" });
      }

      const {
        price, cost, ownership
      } = req.body;

      // ✅ VALIDATION (only if provided)
      if (price !== undefined && price <= 0) {
        return res.status(400).json({ error: "Invalid price" });
      }

      if (cost !== undefined && cost < 0) {
        return res.status(400).json({ error: "Invalid cost" });
      }

      if (ownership && !["company", "client"].includes(ownership)) {
        return res.status(400).json({ error: "Invalid ownership type" });
      }

      // ❌ Prevent frontend from forcing status to sold
      if (req.body.status === "sold") {
        return res.status(400).json({
          error: "Car can only be marked as sold via sales system"
        });
      }

      // prevent duplicate plate number
      if (req.body.plate_number) {

        const normalizedPlate = normalizePlate(req.body.plate_number);

        const existing = await Car.findOne({
          where: { plate_number: normalizedPlate }
        });

        if (existing && existing.id != id) {
          return res.status(400).json({
            error: "Plate number already exists"
          });
        }

        req.body.plate_number = normalizedPlate;
      }

      // ✅ UPDATE CAR
      await car.update({
        ...req.body,
        updated_by: user.id
      });

      // ✅ HANDLE IMAGES
      if (req.files && req.files.length > 0) {
        const images = req.files.map(file => ({
          image_path: `/uploads/${file.filename}`,
          car_id: id
        }));

        await CarImage.bulkCreate(images);
      }

      res.json({ message: "Car updated successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // =========================
  // DELETE IMAGE
  // =========================
  deleteImage: async (req, res) => {
    try {
      const { id } = req.params;

      const image = await CarImage.findByPk(id);
      if (!image) return res.status(404).json({ error: "Image not found" });

      const filePath = path.join(__dirname, "..", "uploads", path.basename(image.image_path));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await image.destroy();

      res.json({ message: "Image deleted successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // =========================
  // DELETE CAR
  // =========================
  deleteCar: async (req, res) => {
    try {
      const { id } = req.params;

      const images = await CarImage.findAll({ where: { car_id: id } });

      images.forEach(img => {
        const filePath = path.join(__dirname, "..", "uploads", path.basename(img.image_path));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      await CarImage.destroy({ where: { car_id: id } });
      await Car.destroy({ where: { id } });

      res.json({ message: "Car and images deleted successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // =========================
  // GENERATE CARS REPORT
  // =========================
  generateCarsReport: async (req, res) => {
    try {
      const {
        make,
        year,
        status,
        ownership,
        search,
        startDate,
        endDate
      } = req.query;

      const where = {};

      if (make) where.make = make;
      if (year) where.year = year;
      if (status) where.status = status;
      if (ownership) where.ownership = ownership;

      // Date filter
      if (startDate && endDate) {
        where.createdAt = {
          [require("sequelize").Op.between]: [
            new Date(startDate),
            new Date(endDate)
          ]
        };
      }

      let cars = await Car.findAll({
        where,
        order: [["createdAt", "DESC"]]
      });

      // search filter
      if (search) {
        const s = search.toLowerCase();
        cars = cars.filter(c =>
          c.make.toLowerCase().includes(s) ||
          c.model.toLowerCase().includes(s) ||
          String(c.year).includes(s) ||
          (c.plate_number && c.plate_number.toLowerCase().includes(s))
        );
      }

      // ======================
      // CALCULATIONS
      // ======================

      const totalCars = cars.length;

      const totalValue = cars.reduce(
        (sum, c) => sum + Number(c.price || 0),
        0
      );

      const totalCost = cars.reduce(
        (sum, c) => sum + Number(c.cost || 0),
        0
      );

      const totalProfit = totalValue - totalCost;

      const availableCount = cars.filter(c => c.status === "available").length;
      const soldCount = cars.filter(c => c.status === "sold").length;

      const companyCount = cars.filter(c => c.ownership === "company").length;
      const clientCount = cars.filter(c => c.ownership === "client").length;

      // ======================
      // PDF
      // ======================

      const doc = new PDFDocument({margin: 30,size: "A4",layout: "landscape"});

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=cars-report-${Date.now()}.pdf`
      );

      doc.pipe(res);

      // Title
      doc.fontSize(18).text("Cars Inventory Report", { align: "center" });

      doc.moveDown();

      doc
        .fontSize(10)
        .text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`);

      doc.moveDown();

      // Filters section
      doc.fontSize(12).text("Filtered as:");
      doc.fontSize(10);

      doc.text(`Make: ${make || "All"}`);
      doc.text(`Year: ${year || "All"}`);
      doc.text(`Status: ${status || "All"}`);
      doc.text(`Ownership: ${ownership || "All"}`);
      doc.text(`Search: ${search || "None"}`);
      doc.text(
        `Date Range: ${
          startDate && endDate
            ? `${startDate} → ${endDate}`
            : "All time"
        }`
      );

      doc.moveDown();

    // ======================
    // TABLE
    // ======================
    doc.fontSize(14).text("Cars List", { underline: true });
    doc.moveDown();

    const table = {
      headers: [
        "Plate",
        "Car",
        "Ownership",
        "Status",
        "Cost (KSh)",
        "Price (KSh)",
        "Potential Profit (KSh)",
        "Location"
      ],

      rows: cars.map(car => [
        car.plate_number || "-",
        `${car.make} ${car.model} (${car.year})`,
        car.ownership,
        car.status,
        Number(car.cost || 0).toLocaleString(),
        Number(car.price || 0).toLocaleString(),
        Number((car.price || 0) - (car.cost || 0)).toLocaleString(),
        car.location
      ])
    };

    // totals row
    table.rows.push([
      "TOTALS",
      "",
      "",
      "",
      totalCost.toLocaleString(),
      totalValue.toLocaleString(),
      totalProfit.toLocaleString(),
      ""
    ]);

    doc.table(table, {
      columnsSize: [110, 200, 90, 80, 110, 110, 130, 120],
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
    // SUMMARY STATS
    // ======================

    doc.moveDown(2);

    doc.font("Helvetica-Bold").fontSize(12).text("Summary");
    doc.moveDown();

    doc.font("Helvetica").fontSize(10);

    doc.font("Helvetica-Bold").text("Total Cars: ", { continued: true })
      .font("Helvetica").text(totalCars);

    doc.font("Helvetica-Bold").text("Available Cars: ", { continued: true })
      .font("Helvetica").text(availableCount);

    doc.font("Helvetica-Bold").text("Sold Cars: ", { continued: true })
      .font("Helvetica").text(soldCount);

    doc.font("Helvetica-Bold").text("Company Cars: ", { continued: true })
      .font("Helvetica").text(companyCount);

    doc.font("Helvetica-Bold").text("Client Cars: ", { continued: true })
      .font("Helvetica").text(clientCount);

    doc.moveDown();

    doc.font("Helvetica-Bold").text("Total Inventory Value: ", { continued: true })
      .font("Helvetica").text(`KSh ${totalValue.toLocaleString()}`);

    doc.font("Helvetica-Bold").text("Total Cost: ", { continued: true })
      .font("Helvetica").text(`KSh ${totalCost.toLocaleString()}`);

    doc.font("Helvetica-Bold").text("Profit Potential: ", { continued: true })
      .font("Helvetica").text(`KSh ${totalProfit.toLocaleString()}`);

    doc.end();

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate report" });
    }
  }

};

module.exports = carController;