const { Car, CarImage } = require("../models");
const path = require("path");
const fs = require("fs");

const carController = {

  // =========================
  // ADD CAR
  // =========================
  addCar: async (req, res) => {
    try {
      const {
        make, model, year, transmission, fuel, body,
        condition, color, mileage, engine, location,
        price, cost, ownership, description
      } = req.body;

      const user = req.user;

      // ✅ VALIDATION
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
        make, model, year, transmission, fuel, body,
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
  }

};

module.exports = carController;