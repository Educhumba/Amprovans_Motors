require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, User } = require("./models");

(async () => {
  try {
    await sequelize.sync();

    const existing = await User.findOne({ where: { username: "admin" } });

    if (existing) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      username: "admin",
      password: hashedPassword,
      role: "admin"
    });

    console.log("✅ Admin user created successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();