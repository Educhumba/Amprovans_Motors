const sequelize = require("../config/database");

const User = require("./User");
const Car = require("./Car");
const CarImage = require("./CarImage");

// Relationships
Car.hasMany(CarImage, { as: "images", onDelete: "CASCADE" });
CarImage.belongsTo(Car);

module.exports = {
  sequelize,
  User,
  Car,
  CarImage
};