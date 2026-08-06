require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const authRoutes = require("./routes/auth.route");
const adminRoutes = require("./routes/admin.route");
const userRoutes = require("./routes/user.route")  
const notificationRoutes = require("./routes/notification.route");
const cookieParser = require("cookie-parser");

// const userDetails = require("./apis/users/userDetails");
const connectDB=require('./config/db')
// const securityRoutes = require("./apis/security/security.route");


const app = express();


// Database connection
connectDB()

// Middleware
// Allow the configured FRONTEND_URL (from .env) first so local dev origin is included
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3116",
  "http://localhost:3110",
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:3117",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:3110",
  "http://127.0.0.1:3116",
  "http://127.0.0.1:5173",
  "https://dev-easyfind.vjstartup.com",
  "https://dev-easyfind-admin.vjstartup.com",
  "https://easyfind.vjstartup.com",
  "https://easyfind-admin.vjstartup.com",
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  return allowedOrigins.includes(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
};

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, origin || true); // ✅ allow request and echo the request origin
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // ✅ required for cookies
}));
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());
// app.use(passport.initialize());

// // DB Connect
// const connectDB = require("./config/db");
// connectDB();

// Routes
app.get("/" ,(req,res)=>{
    res.send("Hello world")
})
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "healthy",
        service: "easyfind-be", 
        timestamp: new Date().toISOString()
    });
});
app.use("/auth", authRoutes);
app.use("/api/items/admin", adminRoutes);
app.use("/api/items", userRoutes);
app.use("/api/notifications", notificationRoutes);
// app.use("/api", userDetails);

// app.use("/api/security", securityRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: err.stack ? err.stack.split('\n').slice(0, 5).join('\n') : undefined,
  });
});

// Start email scheduler
const { startEmailScheduler } = require('./utils/emailScheduler');
startEmailScheduler();

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
