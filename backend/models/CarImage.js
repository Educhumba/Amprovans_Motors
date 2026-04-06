const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CarImage = sequelize.define("CarImage", {
  image_path: {   // ✅ matches DB
    type: DataTypes.STRING,
    allowNull: false
  },
  car_id: {       // ✅ matches DB
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: "car_images", // ✅ force correct table name
  timestamps: false        // if your table has no timestamps
});

module.exports = CarImage;