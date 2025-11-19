const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decodedToken = jwt.verify(token, process.env.SECURE_KEY);
    const userId = decodedToken.userId;
    req.auth = {
      userId: userId,
    };
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};
