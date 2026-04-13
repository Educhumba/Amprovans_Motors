const PDFDocument = require("pdfkit-table");
const moment = require("moment");
const { Op, Sequelize } = require("sequelize");
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
          commission = profit * 0.05;
        }

      } else {
        const companyCommissionRate = 0.08; // 8%
        const agentShareRate = 0.05; // 5% of company commission

        const companyCommission = sold_price * companyCommissionRate;

        if (hasAgent) {
          commission = companyCommission * agentShareRate;
        } else {
          commission = 0;
        }
        profit = companyCommission;
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

      let whereClause = {};

      // 🔒 Agents only see their sales
      if (user.role === "agent") {
        whereClause.agent_id = user.id;
      }

      const sales = await Sale.findAll({
        where: whereClause,
        order: [["created_at", "DESC"]],
        include: [
          { model: Car, as: 'Car' },
          { model: User, as: "Agent", attributes: ["id", "name"] }
        ]
      });

      res.json(sales);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
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

    getAgentRanking: async (req, res) => {
      try {
        const rankings = await Sale.findAll({
          attributes: [
            "agent_id",
            [Sequelize.fn("SUM", Sequelize.col("sold_price")), "totalSales"],
            [Sequelize.fn("SUM", Sequelize.col("profit")), "totalProfit"],
            [Sequelize.fn("SUM", Sequelize.col("commission")), "totalCommission"]
          ],
          where: {
            agent_id: {
              [Op.ne]: null
            }
          },
          include: [
            { model: User, as: "Agent", attributes: ["name"] }
          ],
          group: ["agent_id", "Agent.id"],
          order: [[Sequelize.literal("totalProfit"), "DESC"]]
        });

        res.json(rankings);
      } catch (err) {
        res.status(500).json({ message: "Error ranking agents" });
      }
    },

    generateSalesReport: async (req, res) => {
      try {
        const user = req.user;

        if (!["admin", "agent"].includes(user.role)) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const { type, start_date, end_date, agent_id, ownership } = req.query;

        let whereClause = {};
        const now = new Date();

        if (user.role === "agent") {
          whereClause.agent_id = user.id;
        }
        // Admin filtering by agent
        if (user.role === "admin" && agent_id) {
          whereClause.agent_id = agent_id;
        }

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

if (ownership) {
  whereClause['$Car.ownership$'] = ownership;
}
        const sales = await Sale.findAll({
          where: whereClause,
          include: [
            { model: Car, as: "Car", attributes: ["make", "model", "year", "ownership", "plate_number"] },
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
        const { detail } = req.query;

      // =========================
      // 📄 PROFESSIONAL PDF
      // =========================
      const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
      const fileName = `sales-report-${type || "all"}-${Date.now()}.pdf`;

      res.setHeader("Content-disposition", `attachment; filename=${fileName}`);
      res.setHeader("Content-type", "application/pdf");

      doc.pipe(res);

      // =========================
      // 🧾 HEADER
      // =========================
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("SALES REPORT", { align: "center" });

      doc.moveDown(0.5);

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`, { align: "center" });

      if (type === "weekly") {
        doc.text(`Period: Last 7 Days`, { align: "center" });
      } else if (type === "monthly") {
        doc.text(
          `Period: ${moment().startOf("month").format("DD MMM YYYY")} - ${moment().endOf("month").format("DD MMM YYYY")}`,
          { align: "center" }
        );
      } else if (type === "custom") {
        doc.text(`Period: ${start_date} - ${end_date}`, { align: "center" });
      }

      doc.moveDown();

      // Divider
      doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();

      doc.moveDown();

      // =========================
      // 📊 TABLE
      // =========================
      const table = {
        headers: [
          { label: "Car", property: "car", width: 150 },
          { label: "Number Plate", property: "plate", width: 85 },
          { label: "Price (Ksh)", property: "price", width: 85 },
          { label: "Profit (Ksh)", property: "profit", width: 85 },
          { label: "Comm.(Ksh)", property: "commission", width: 80 },
          { label: "Net Profit(Ksh)", property: "netProfit", width: 85 },
          { label: "Agent", property: "agent", width: 100 },
          { label: "Date", property: "date", width: 70 }, // ✅ NOW GUARANTEED TO FIT
        ],

        datas: sales.map((s) => ({
          car: `${s.Car.make} ${s.Car.model} (${s.Car.year})`,
          plate: s.Car.plate_number,
          price: Number(s.sold_price).toLocaleString(),
          profit: Number(s.profit).toLocaleString(),
          commission: Number(s.commission).toLocaleString(),
          netProfit: Number(s.net_profit).toLocaleString(),
          agent: s.Agent ? s.Agent.name : "Admin",
          date: moment(s.created_at).format("DD/MM/YY") // shorter = safer
        }))
      };

      await doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9),

        prepareRow: (row, i) => {
          doc.font("Helvetica").fontSize(8);

          // subtle highlight for strong rows
          const net = Number(row.netProfit.replace(/[^0-9]/g, ""));
        }
      });

      doc.moveDown();

      // Divider
      doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();

      doc.moveDown(2);

      // =========================
      // 📈 SUMMARY (CENTERED)
      // =========================
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("REPORT SUMMARY", { align: "center" });

      doc.moveDown();

      doc.fontSize(11);

      // Helper for centered lines
      const centerText = (label, value) => {
        doc
          .font("Helvetica-Bold")
          .text(label, { align: "center" });
        doc
          .font("Helvetica")
          .text(value, { align: "center" });
        doc.moveDown(0.5);
      };

      if (detail === "totalSales") {
        centerText("Total Sales", `KSh ${totalSales.toLocaleString()}`);

      } else if (detail === "grossProfit") {
        centerText("Gross Profit", `KSh ${totalProfit.toLocaleString()}`);

      } else if (detail === "commission") {
        centerText("Total Commission", `KSh ${totalCommission.toLocaleString()}`);

      } else if (detail === "netProfit") {
        centerText("Net Profit", `KSh ${netProfit.toLocaleString()}`);

      } else {
        centerText("Total Sales", `KSh ${totalSales.toLocaleString()}`);
        centerText("Total Profit", `KSh ${totalProfit.toLocaleString()}`);
        centerText("Total Commission", `KSh ${totalCommission.toLocaleString()}`);
        centerText("Net Profit", `KSh ${netProfit.toLocaleString()}`);
      }

      // =========================
      // ✅ FOOTER
      // =========================
      doc.moveDown(2);

      doc
        .fontSize(8)
        .fillColor("gray")
        .text("Confidential - Company Internal Report", { align: "center" });

      doc.end();

      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error generating PDF", error: err.message });
      }
    },

    generateDetailedSalesReport: async (req, res) => {
      try {
        const { start_date, end_date, agent_id } = req.query;
        const { ownership } = req.query;

        if (ownership) {
          filter['$Car.ownership$'] = ownership;
        }
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
            { model: Car, as: "Car", attributes: ["make", "model", "year", "ownership"] },
            { model: User, as: "Agent", attributes: ["id", "name"] }
          ],
          order: [["created_at", "DESC"]]
        });

        if (!sales.length) {
          return res.status(404).json({ message: "No sales found for the selected period" });
        }

        if (ownership) {
  whereClause['$Car.ownership$'] = ownership;
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
    },

    generateAgentRankingReport: async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can generate ranking reports" });
    }

    const { start_date, end_date, ownership } = req.query;

    let whereClause = {
      agent_id: {
        [Op.ne]: null
      }
    };

    // Date filter
    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.gte]: new Date(start_date),
        [Op.lte]: new Date(end_date)
      };
    }

    // Ownership filter
    if (ownership) {
      whereClause['$Car.ownership$'] = ownership;
    }

    const rankings = await Sale.findAll({
      attributes: [
        "agent_id",
        [Sequelize.fn("SUM", Sequelize.col("sold_price")), "totalSales"],
        [Sequelize.fn("SUM", Sequelize.col("profit")), "totalProfit"],
        [Sequelize.fn("SUM", Sequelize.col("commission")), "totalCommission"]
      ],
      include: [
        { model: User, as: "Agent", attributes: ["name"] },
        { model: Car, as: "Car", attributes: [] }
      ],
      where: whereClause,
      group: ["agent_id", "Agent.id"],
      order: [[Sequelize.literal("totalProfit"), "DESC"]]
    });

    if (!rankings.length) {
      return res.status(404).json({ message: "No ranking data found" });
    }

    // =========================
    // 📄 PDF GENERATION
    // =========================
    const doc = new PDFDocument({ margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=agent-ranking-${Date.now()}.pdf`);

    doc.pipe(res);

    doc.fontSize(18).text("Agent Performance Ranking", { align: "center" });
    doc.moveDown();

    if (start_date && end_date) {
      doc.fontSize(10).text(`Period: ${start_date} → ${end_date}`, { align: "center" });
    }

    if (ownership) {
      doc.text(`Ownership: ${ownership}`, { align: "center" });
    }

    doc.moveDown(2);

    const table = {
      headers: ["Rank", "Agent", "Total Sales", "Profit", "Commission"],
      rows: rankings.map((r, index) => [
        index + 1,
        r.Agent?.name || "Unknown",
        `KSh ${Number(r.dataValues.totalSales).toLocaleString()}`,
        `KSh ${Number(r.dataValues.totalProfit).toLocaleString()}`,
        `KSh ${Number(r.dataValues.totalCommission).toLocaleString()}`
      ])
    };

    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
      prepareRow: () => doc.font("Helvetica").fontSize(10)
    });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating ranking report" });
  }
}

};

module.exports = saleController;