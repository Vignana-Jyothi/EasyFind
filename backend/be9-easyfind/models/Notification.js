const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["success", "info", "warning", "error"],
      default: "info",
    },
    icon: {
      type: String,
      default: "Bell",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoundItem",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
