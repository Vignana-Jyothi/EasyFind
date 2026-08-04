const jwt = require("jsonwebtoken");
const User = require("../models/User");

function extractTokenFromCookies(req) {
  const token = req.cookies?.userToken;
  return token || null;
}

const auth = (req, res, next) => {
  // Prefer HttpOnly cookie
  let token = extractTokenFromCookies(req);

  // Fallback to Authorization header for backward compatibility
  if (!token) {
    const authHeader = req.headers.authorization || req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET);
    req.user = decoded; // Attach user payload to the request

    // Sync student user details to Userstemp database if not exists
    if (decoded.email) {
      User.findOne({ email: decoded.email }).then(existingUser => {
        if (!existingUser) {
          const newUser = new User({
            name: decoded.name || "Student",
            email: decoded.email,
            googleId: decoded.googleId || "",
            avatar: decoded.picture || ""
          });
          newUser.save().catch(err => console.error("Error saving student to Userstemp database:", err));
        }
      }).catch(err => console.error("Error checking student in Userstemp database:", err));
    }

    next();
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    res.status(401).json({ 
      message: "Unauthorized: Invalid or expired token", 
      error: err.message, 
      tokenLength: token.length, 
      secretLength: (process.env.AUTH_JWT_SECRET || "").length 
    });
  }
};

module.exports = auth;
