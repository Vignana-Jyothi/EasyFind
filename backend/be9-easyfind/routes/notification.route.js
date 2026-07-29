const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const userAuth = require("../middlewares/user-auth");
const adminAuth = require("../middlewares/admin-auth");
const jwt = require("jsonwebtoken");

// Fetch notifications for a student
router.get("/", userAuth, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const notifications = await Notification.find({ email: email })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      email: email,
      isRead: false,
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch notifications for admin
router.get("/admin", adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ email: "admin" })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      email: "admin",
      isRead: false,
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark single notification as read (with authentication & ownership validation)
router.patch("/:id/read", async (req, res) => {
  try {
    let token = req.cookies?.userToken || null;
    if (!token) {
      const authHeader = req.headers.authorization || req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    // Verify ownership
    if (notification.email === "admin") {
      const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];
      if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email)) {
        return res.status(403).json({ success: false, message: "Forbidden: Not authorized as admin" });
      }
    } else {
      if (!decoded.email || decoded.email.toLowerCase() !== notification.email.toLowerCase()) {
        return res.status(403).json({ success: false, message: "Forbidden: Cannot mutate another user's notifications" });
      }
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark all as read for student
router.patch("/read-all", userAuth, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    await Notification.updateMany(
      { email: email, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark all as read for admin
router.patch("/read-all-admin", adminAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { email: "admin", isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: "All admin notifications marked as read" });
  } catch (error) {
    console.error("Error marking all admin read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
