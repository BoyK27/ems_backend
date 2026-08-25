import jwt from "jsonwebtoken";
import User from "../models/User.js";

const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Token missing or malformed",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Token empty" });
    }

    const jwtSecret = process.env.JWT_KEY || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, jwtSecret);

    // Support both _id and id stored in JWT payload
    const userId = decoded._id || decoded.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User account no longer exists" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Token expired or invalid",
    });
  }
};

export default verifyUser;
