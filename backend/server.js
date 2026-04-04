const app = require("./app");
const { sequelize } = require("./models");
require('dotenv').config();

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");
  app.listen(PORT, () => console.log("Server running on " + PORT));
});