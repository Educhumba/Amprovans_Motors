const { Car, CarImage } = require("../models");
const path = require("path");

const carController = {
  addCar: async (req, res) => {
    try {
      const car = await Car.create(req.body);

      if (req.files && req.files.length > 0) {
        const images = req.files.map(file => ({
          url: `/uploads/${file.filename}`,
          CarId: car.id
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

  deleteCar: async (req, res) => {
    try {
      const { id } = req.params;
      await Car.destroy({ where: { id } });
      res.json({ message: "Car deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = carController;