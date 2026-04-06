const { Car, CarImage } = require("../models");
const path = require("path");
const fs = require("fs");

const carController = {
  addCar: async (req, res) => {
    try {
      const car = await Car.create(req.body);

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

  getCars: async (req, res) => {
    try {
      const cars = await Car.findAll({ include: { model: CarImage, as: "images" } });
      res.json(cars);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      await Car.update({ status: req.body.status }, { where: { id } });
      res.json({ message: "Status updated" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteImage: async (req, res) => {
    try {
      const { id } = req.params;

      // Find image
      const image = await CarImage.findByPk(id);
      if (!image) return res.status(404).json({ error: "Image not found" });

      // Delete file from uploads folder
      const filePath = path.join(__dirname, "..", "uploads",path.basename(image.image_path));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from DB
      await image.destroy();

      res.json({ message: "Image deleted successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  updateCar: async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Update car basic details
      await Car.update(req.body, { where: { id } });

      // 2. Handle images ONLY if new ones are uploaded
      if (req.files && req.files.length > 0) {
        // OPTION A: Add new images (keep old ones)
        const images = req.files.map(file => ({
          image_path: `/uploads/${file.filename}`,
          car_id: id
        }));

        await CarImage.bulkCreate(images);

        // -----------------------------
        // OPTION B (optional alternative):
        // Replace old images completely
        // -----------------------------
        /*
        await CarImage.destroy({ where: { car_id: id } });

        const images = req.files.map(file => ({
          url: `/uploads/${file.filename}`,
          CarId: id
        }));

        await CarImage.bulkCreate(images);
        */
      }

      res.json({ message: "Car updated successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  deleteCar: async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Get all images
      const images = await CarImage.findAll({ where: { car_id: id } });

      // 2. Delete files from storage
      images.forEach(img => {
        const filePath = path.join(__dirname, "..", "uploads", path.basename(img.image_path));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      // 3. Delete DB image records
      await CarImage.destroy({ where: { car_id: id } });

      // 4. Now delete car
      await Car.destroy({ where: { id } });

      res.json({ message: "Car and images deleted successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
  };

module.exports = carController;