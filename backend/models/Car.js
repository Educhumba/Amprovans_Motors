// models/Car.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // import directly

const Car = sequelize.define("Car", {
  make: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  transmission: { type: DataTypes.STRING, allowNull: false },
  fuel: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.STRING, allowNull: false },
  condition: { type: DataTypes.STRING, allowNull: false },
  color: { type: DataTypes.STRING, allowNull: false },
  mileage: { type: DataTypes.INTEGER, allowNull: false },
  engine: { type: DataTypes.INTEGER, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: "available" },
  description: { type: DataTypes.TEXT }
});

module.exports = Car;