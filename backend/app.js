const express = require("express");
const cors = require("cors");
const agentRoutes = require("./routes/agentRoutes");
const saleRoutes = require("./routes/saleRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const carHireRoutes = require("./routes/carHireRoutes");
const clientMessageRoutes = require("./routes/clientMessageRoute");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cars", require("./routes/carRoutes"));
app.use("/api/agents", agentRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/car-hire", carHireRoutes);
app.use("/api/client-messages", clientMessageRoutes);

module.exports = app;