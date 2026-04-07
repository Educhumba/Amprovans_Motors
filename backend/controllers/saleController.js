const { Car, Sale } = require("../models");

const saleController = {

  createSale: async (req, res) => {
    try {
      const { car_id, sold_price } = req.body;
      const user = req.user;

      // ✅ Validate price
      if (!sold_price || sold_price <= 0) {
        return res.status(400).json({ message: "Invalid selling price" });
      }

      // ✅ Fetch car
      const car = await Car.findByPk(car_id);

      if (!car) {
        return res.status(404).json({ message: "Car not found" });
      }

      // 🔴 Prevent double sale
      if (car.status === "sold") {
        return res.status(400).json({ message: "Car already sold" });
      }

      //prevent sale of booked car
      if (car.status === "booked") {
        return res.status(400).json({ message: "Car is currently booked (on hire)" });
      }

      let profit = 0;
      let commission = 0;
      let net_profit = 0;

      const isAgent = user.role === "agent";

      // =========================
      // 💰 BUSINESS LOGIC
      // =========================

      if (car.ownership === "company") {

        profit = sold_price - car.cost;

        // ❌ Prevent loss
        if (profit < 0) {
          return res.status(400).json({
            message: "Selling price cannot be less than cost"
          });
        }

        if (isAgent) {
          commission = profit * 0.2;
        }

      } else {
        // client-owned

        profit = sold_price;

        if (isAgent) {
          commission = profit * 0.1;
        }
      }

      net_profit = profit - commission;

      // =========================
      // 📝 CREATE SALE
      // =========================
      let agent_id = null;
        if (user.role === "agent") {
            agent_id = user.id;
        } else if (user.role === "admin" && req.body.agent_id) {
            agent_id = req.body.agent_id;
        }

      const sale = await Sale.create({
        car_id,
        agent_id,
        sold_price,
        profit,
        commission,
        net_profit,
        sold_by_role: user.role
      });

      // =========================
      // 🔄 UPDATE CAR
      // =========================

      await car.update({
        status: "sold",
        updated_by: user.id
      });

      res.status(201).json({
        message: "Sale recorded successfully",
        sale
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  // =========================
  // GET ALL SALES
  // =========================
    getAllSales: async (req, res) => {
    try {
        const user = req.user;
        let sales;

        if (user.role === "admin") {
        sales = await Sale.findAll({
            include: [{ model: Car, as: 'Car' }] // only include Car
        });
        } else {
        sales = await Sale.findAll({
            where: { agent_id: user.id },
            include: [{ model: Car, as: 'Car' }]
        });
        }

        res.json(sales);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
    }

};

module.exports = saleController;