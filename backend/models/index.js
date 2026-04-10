const sequelize = require("../config/database");

const User = require("./User");
const Car = require("./Car");
const CarImage = require("./CarImage");
const Sale = require("./Sale");
const ClientCar = require("./ClientCar")(sequelize, require("sequelize").DataTypes);
const CarHire = require("./CarHire");
const ClientMessage = require("./ClientMessage");

// Relationships
Car.hasMany(CarImage, { foreignKey: "car_id", as: "images", onDelete: "CASCADE" });
CarImage.belongsTo(Car, {foreignKey: "car_id", as: "car"});
User.hasMany(Sale, { foreignKey: "agent_id", as: "Sales" });
Sale.belongsTo(User, { foreignKey: "agent_id", as: "Agent" });

Car.hasOne(Sale, { foreignKey: "car_id" });
Sale.belongsTo(Car, { foreignKey: "car_id" });

module.exports = {
  sequelize,
  User,
  Car,
  CarImage,
  Sale,
  ClientCar,
  CarHire,
  ClientMessage
};