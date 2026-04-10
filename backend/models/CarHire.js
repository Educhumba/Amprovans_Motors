const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CarHire = sequelize.define("CarHire", {
  full_name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },

  car_id: { type: DataTypes.INTEGER, allowNull: false },
  car_name: { type: DataTypes.STRING },

  daily_rate: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  total_cost: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  total_days: { type: DataTypes.INTEGER, allowNull: false },

  pickup_date: { type: DataTypes.DATEONLY, allowNull: false },
  return_date: { type: DataTypes.DATEONLY, allowNull: false },

  pickup_location: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT },

  status: {
    type: DataTypes.ENUM("pending","approved","rejected"),
    defaultValue: "pending"
  },

  approved_by: { type: DataTypes.INTEGER },
  approved_at: { type: DataTypes.DATE },

  rejection_reason: { type: DataTypes.TEXT },
},{
  tableName: "car_hires", 
  timestamps: true
}
);

module.exports = CarHire;