module.exports = (sequelize, DataTypes) => {
    const ClientCar = sequelize.define(
        "ClientCar",
        {
            owner_name: { type: DataTypes.STRING, allowNull: false },
            owner_phone: { type: DataTypes.STRING(20), allowNull: false },
            owner_email: { type: DataTypes.STRING, allowNull: true },
            plate_number: { type: DataTypes.STRING(50), allowNull: false },
            make: { type: DataTypes.STRING, allowNull: false },
            model: { type: DataTypes.STRING, allowNull: false },
            year: { type: DataTypes.INTEGER, allowNull: false },
            mileage: { type: DataTypes.INTEGER, allowNull: true },
            engine: { type: DataTypes.INTEGER, allowNull: true },
            transmission: { type: DataTypes.STRING(50), allowNull: true },
            fuel_type: { type: DataTypes.STRING(50), allowNull: true },
            body: { type: DataTypes.STRING(50), allowNull: true },
            condition: { type: DataTypes.STRING(50), allowNull: true },
            color: { type: DataTypes.STRING(50), allowNull: true },
            location: { type: DataTypes.STRING(100), allowNull: true },
            expected_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
            agreed_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
            commission_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0.08 },
            commission_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
            description: { type: DataTypes.TEXT, allowNull: true },
            images: { type: DataTypes.JSON, allowNull: true },
            status: { 
                type: DataTypes.ENUM("pending", "approved", "rejected", "sold"), 
                allowNull: true, 
                defaultValue: "pending" 
            },
            car_id: { type: DataTypes.INTEGER, allowNull: true },
            reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
            reviewed_at: { type: DataTypes.DATE, allowNull: true },
            admin_notes: { type: DataTypes.TEXT, allowNull: true }
        },
        {
            tableName: "client_cars",
            timestamps: true,     // let Sequelize manage createdAt/updatedAt
            underscored: false    // match your existing camelCase columns
        }
    );

    return ClientCar;
};