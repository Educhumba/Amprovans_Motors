const sequelize = require("../config/database");

const User = require("./User");
const Car = require("./Car");
const CarImage = require("./CarImage");
const Sale = require("./Sale");

// Relationships
Car.hasMany(CarImage, { foreignKey: "car_id", as: "images", onDelete: "CASCADE" });
CarImage.belongsTo(Car, {foreignKey: "car_id"});
User.hasMany(Sale, { foreignKey: "agent_id" });
Sale.belongsTo(User, { foreignKey: "agent_id" });

Car.hasOne(Sale, { foreignKey: "car_id" });
Sale.belongsTo(Car, { foreignKey: "car_id" });

module.exports = {
  sequelize,
  User,
  Car,
  CarImage,
  Sale
};