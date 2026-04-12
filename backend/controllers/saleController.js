const PDFDocument = require("pdfkit-table");
const moment = require("moment");
const { Op } = require("sequelize");
const { Car, Sale, User } = require("../models");

const saleController = {

  createSale: async (req, res) => {
    try {
      const { car_id, sold_price, agent_id: requestAgentId } = req.body;
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

      const hasAgent = user.role === "agent" || req.body.agent_id;

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

        if (hasAgent) {
          commission = profit * 0.2;
        }

      } else {
        // client-owned

        profit = sold_price;

        if (hasAgent) {
          commission = profit * 0.1;
        }
      }

      net_profit = profit - commission;

      // =========================
      // 📝 CREATE SALE
      // =========================
      let agent_id = null;

      // 🔒 Agents CANNOT override this
      if (user.role === "agent") {
        agent_id = user.id;
      }

      // ✅ Admin can assign agent
      if (user.role === "admin") {
        agent_id = requestAgentId || null;
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
          order: [["created_at", "DESC"]],
          include: [
            { model: Car, as: 'Car' },
            { model: User, as: "Agent", attributes: ["id", "name"] }
          ]
        });
        } else {
        sales = await Sale.findAll({
          order: [["created_at", "DESC"]],
          include: [
            { model: Car, as: 'Car' },
            { model: User, as: "Agent", attributes: ["id", "name"] }
          ]
        });
        }

        res.json(sales);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
    },

    getSalesSummary: async (req, res) => {
      try {
        const user = req.user;

        let whereClause = {};

        if (user.role === "agent") {
          whereClause.agent_id = user.id;
        }

        const sales = await Sale.findAll({ where: whereClause });

        let totalSales = 0;
        let totalProfit = 0;
        let totalCommission = 0;

        sales.forEach(s => {
          totalSales += Number(s.sold_price || 0);
          totalProfit += Number(s.profit || 0);
          totalCommission += Number(s.commission || 0);
        });

        res.json({
          totalSales,
          totalProfit,
          totalCommission,
          netProfit: totalProfit - totalCommission
        });

      } catch (err) {
        res.status(500).json({ message: "Error getting summary" });
      }
    },

    generateSalesReport: async (req, res) => {
      try {
        const user = req.user;

        if (user.role !== "admin") {
          return res.status(403).json({ message: "Only admins can generate reports" });
        }

        const { type, start_date, end_date } = req.query;

        let whereClause = {};
        const now = new Date();

        if (type === "weekly") {
          const lastWeek = new Date();
          lastWeek.setDate(now.getDate() - 7);
          whereClause.created_at = { [Op.gte]: lastWeek, [Op.lte]: now };
        } else if (type === "monthly") {
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          whereClause.created_at = { [Op.gte]: firstDayOfMonth, [Op.lte]: lastDayOfMonth };
        } else if (type === "custom") {
          if (!start_date || !end_date) {
            return res.status(400).json({ message: "start_date and end_date required for custom reports" });
          }
          whereClause.created_at = { [Op.gte]: new Date(start_date), [Op.lte]: new Date(end_date) };
        } // default: all sales if type not specified

        const sales = await Sale.findAll({
          where: whereClause,
          include: [
            { model: Car, as: "Car", attributes: ["make", "model", "year"] },
            { model: User, as: "Agent", attributes: ["name"] }
          ],
          order: [["created_at", "DESC"]]
        });

        if (sales.length === 0) {
          return res.status(404).json({ message: "No sales found for the selected period" });
        }

        // Totals
        let totalSales = 0, totalProfit = 0, totalCommission = 0;
        sales.forEach(s => {
          totalSales += Number(s.sold_price || 0);
          totalProfit += Number(s.profit || 0);
          totalCommission += Number(s.commission || 0);
        });
        const netProfit = totalProfit - totalCommission;

        // PDF Generation (same as previous professional table)
        const doc = new PDFDocument({ margin: 30, size: "A4" });
        const fileName = `sales-report-${type || "all"}-${Date.now()}.pdf`;
        res.setHeader("Content-disposition", `attachment; filename=${fileName}`);
        res.setHeader("Content-type", "application/pdf");

        doc.fontSize(20).text("Sales Report", { align: "center" });
        doc.fontSize(12).text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`, { align: "center" });

        if (type === "weekly") {
          doc.text(`Period: Last 7 days`, { align: "center" });
        } else if (type === "monthly") {
          doc.text(`Period: ${moment().startOf('month').format('DD/MM/YYYY')} - ${moment().endOf('month').format('DD/MM/YYYY')}`, { align: "center" });
        } else if (type === "custom") {
          doc.text(`Period: ${start_date} - ${end_date}`, { align: "center" });
        }

        doc.moveDown();

        const table = {
          headers: [
            { label: "Car", property: "car", width: 150 },
            { label: "Price", property: "price", width: 80 },
            { label: "Profit", property: "profit", width: 80 },
            { label: "Commission", property: "commission", width: 80 },
            { label: "Net Profit", property: "netProfit", width: 80 },
            { label: "Agent", property: "agent", width: 100 },
            { label: "Date", property: "date", width: 80 },
          ],
          datas: sales.map(s => ({
            car: `${s.Car.make} ${s.Car.model} (${s.Car.year})`,
            price: `KSh ${Number(s.sold_price).toLocaleString()}`,
            profit: `KSh ${Number(s.profit).toLocaleString()}`,
            commission: `KSh ${Number(s.commission).toLocaleString()}`,
            netProfit: `KSh ${Number(s.net_profit).toLocaleString()}`,
            agent: s.Agent ? s.Agent.name : "Admin",
            date: moment(s.created_at).format("DD/MM/YYYY")
          }))
        };

        await doc.table(table, {
          prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
          prepareRow: (row, i) => doc.font("Helvetica").fontSize(10)
        });

        doc.moveDown();
        doc.font("Helvetica-Bold").text("Totals:", { align: "right" });
        doc.font("Helvetica").text(`Total Sales: KSh ${totalSales.toLocaleString()}`, { align: "right" });
        doc.text(`Total Profit: KSh ${totalProfit.toLocaleString()}`, { align: "right" });
        doc.text(`Total Commission: KSh ${totalCommission.toLocaleString()}`, { align: "right" });
        doc.text(`Net Profit: KSh ${netProfit.toLocaleString()}`, { align: "right" });

        doc.pipe(res);
        doc.end();

      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error generating PDF", error: err.message });
      }
    },

    generateDetailedSalesReport: async (req, res) => {
      try {
        const { start_date, end_date, agent_id } = req.query;

        let filter = {};
        if (start_date && end_date) {
          filter.created_at = { [Op.gte]: new Date(start_date), [Op.lte]: new Date(end_date) };
        } else if (start_date) {
          filter.created_at = { [Op.gte]: new Date(start_date) };
        } else if (end_date) {
          filter.created_at = { [Op.lte]: new Date(end_date) };
        }
        if (agent_id) filter.agent_id = agent_id;

        const sales = await Sale.findAll({
          where: filter,
          include: [
            { model: Car, as: "Car", attributes: ["make", "model", "year"] },
            { model: User, as: "Agent", attributes: ["id", "name"] }
          ],
          order: [["created_at", "DESC"]]
        });

        if (!sales.length) {
          return res.status(404).json({ message: "No sales found for the selected period" });
        }

        // Totals
        let totalSales = 0, totalProfit = 0, totalCommission = 0;
        sales.forEach(s => {
          totalSales += Number(s.sold_price || 0);
          totalProfit += Number(s.profit || 0);
          totalCommission += Number(s.commission || 0);
        });
        const netProfit = totalProfit - totalCommission;

        // =========================
        // PDF
        // =========================
        const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=sales-report-${Date.now()}.pdf`);

        doc.pipe(res);

        // Title
        doc.fontSize(18).text("Detailed Sales Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`, { align: "center" });

        if (start_date && end_date) {
          doc.text(`Period: ${start_date} → ${end_date}`, { align: "center" });
        }
        if (agent_id) {
          doc.text(`Agent ID: ${agent_id}`, { align: "center" });
        }

        doc.moveDown(2);

        // Table
        const table = {
          headers: [
            "Car",
            "Sold Price (KSh)",
            "Profit (KSh)",
            "Commission (KSh)",
            "Net Profit (KSh)",
            "Agent",
            "Date"
          ],
          rows: sales.map(sale => [
            `${sale.Car.make} ${sale.Car.model} (${sale.Car.year})`,
            Number(sale.sold_price || 0).toLocaleString(),
            Number(sale.profit || 0).toLocaleString(),
            Number(sale.commission || 0).toLocaleString(),
            Number(sale.net_profit || 0).toLocaleString(),
            sale.Agent ? sale.Agent.name : "Admin",
            moment(sale.created_at).format("DD/MM/YYYY")
          ])
        };

        // Totals row
        table.rows.push([
          "TOTALS",
          totalSales.toLocaleString(),
          totalProfit.toLocaleString(),
          totalCommission.toLocaleString(),
          netProfit.toLocaleString(),
          "",
          ""
        ]);

        doc.table(table, {
          columnsSize: [200, 90, 90, 90, 90, 120, 80],
          prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9),
          prepareRow: (row, i) => {
            doc.font("Helvetica").fontSize(8);
            if (i === table.rows.length - 1) doc.font("Helvetica-Bold");
          }
        });

        doc.end();
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate detailed sales report", error: err.message });
      }
    }

};

module.exports = saleController;