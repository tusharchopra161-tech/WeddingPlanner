const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    palace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Palace",
      required: true,
    },

    weddingDate: {
      type: Date,
      required: true,
    },

    guestCount: {
      type: Number,
      required: true,
      min: 100,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled", "expired"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    // Deadline for a pending booking to reserve its date.
    // Do not use a MongoDB TTL index on this field.
    holdExpiresAt: {
      type: Date,
      default: null,
    },
    specialRequests: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);
// Supports queries for bookings by palace, date and status.
bookingSchema.index({
  palace: 1,
  weddingDate: 1,
  bookingStatus: 1,
});
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking