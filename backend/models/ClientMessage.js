const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ClientMessage = sequelize.define("ClientMessage", {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("pending", "resolved"),
        defaultValue: "pending"
    }
}, {
    tableName: "client_messages",
    timestamps: true
});

module.exports = ClientMessage;