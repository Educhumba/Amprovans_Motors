const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Sale = sequelize.define("Sale", {
  car_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  sold_price: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },

  profit: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },

  commission: {
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 0
  },

  net_profit: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },

  sold_by_role: {
    type: DataTypes.ENUM("admin","agent"),
    allowNull: false
  }

}, {
  tableName: "sales",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});

module.exports = Sale;