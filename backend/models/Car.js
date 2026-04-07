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
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  cost: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
  ownership: { type: DataTypes.ENUM("company","client"),allowNull: false, defaultValue: "company" },
  updated_by: {type: DataTypes.INTEGER,allowNull: true},
  status: { type: DataTypes.ENUM("available","sold","booked"), defaultValue: "available" },
  description: { type: DataTypes.TEXT }
});

module.exports = Car;