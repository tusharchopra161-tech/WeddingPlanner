
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    palace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Palace",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "expired"],
    }, 
  },
  { timestamps: true }
);

notificationSchema.index({
  recipient: 1,
  role: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Notification", notificationSchema);
