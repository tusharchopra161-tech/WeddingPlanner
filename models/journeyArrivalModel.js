const mongoose = require("mongoose");
const journeyArrivalSchema = new mongoose.Schema(
  {
    journeyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

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

    arrivedAt: {
      type: Date,
      default: Date.now,
    },

    notificationStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },

    notificationSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JourneyArrival",journeyArrivalSchema);
