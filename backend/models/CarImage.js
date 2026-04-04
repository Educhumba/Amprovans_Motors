// models/CarImage.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // import directly
const Car = require("./Car");

const CarImage = sequelize.define("CarImage", {
  url: { type: DataTypes.STRING, allowNull: false }
});

module.exports = CarImage;