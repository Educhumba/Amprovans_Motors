const jwt = require("jsonwebtoken");

// Middleware to verify token
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) 
    return res.status(401).json({ error: "Access denied. No token provided" });

  const token = authHeader.split(" ")[1]; // Extract the token part after "Bearer"
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // { id, role, email }
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// Middleware to check for roles
const authorize = (roles = []) => {
  // roles can be a string or array
  if (typeof roles === "string") roles = [roles];

  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    next();
  };
};

module.exports = { authenticate, authorize };