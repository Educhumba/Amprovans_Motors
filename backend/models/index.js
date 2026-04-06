const sequelize = require("../config/database");

const User = require("./User");
const Car = require("./Car");
const CarImage = require("./CarImage");

// Relationships
Car.hasMany(CarImage, { foreignKey: "car_id", as: "images", onDelete: "CASCADE" });
CarImage.belongsTo(Car, {foreignKey: "car_id"});

module.exports = {
  sequelize,
  User,
  Car,
  CarImage
};