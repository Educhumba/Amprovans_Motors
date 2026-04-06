// models/userModel.js
const User = require("./User");

// CREATE AGENT
exports.createAgent = async (name, email, phone, password) => {
  const agent = await User.create({
    name,
    email,
    phone,
    password,
    role: "agent",
    status: "active",
    force_password_reset: true,
  });

  return agent.id; // Return the Sequelize-generated ID
};

// FIND USER BY EMAIL
exports.findUserByEmailOrPhone = async (email, phone) => {
  return await User.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
};

// SAVE RESET TOKEN
exports.saveResetToken = async (userId, token, expires) => {
  await User.update(
    { reset_code: token, reset_expires: expires },
    { where: { id: userId } }
  );
};

// GET ALL AGENTS
exports.getAllAgents = async () => {
  return await User.findAll({
    where: { role: "agent" },
    attributes: ["id", "name", "email", "phone", "status"],
  });
};

// UPDATE AGENT STATUS
exports.updateAgentStatus = async (id, status) => {
  await User.update({ status }, { where: { id } });
};