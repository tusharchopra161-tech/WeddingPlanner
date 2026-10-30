const JourneyArrival = require("../models/journeyArrivalModel");
const Palace = require("../models/palaceModels");
const sendUserPush = require("../utils/sendUserPush");
const notifyJourneyArrival = async (req, res) => {
  console.log("========== JOURNEY ARRIVAL REQUEST ==========");
console.log("User:", req.user?._id);
console.log("Role:", req.user?.role);
console.log("Body:", req.body);
  try {
    // Only customers can use palace navigation.
    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only customers can use journey navigation.",
      });
    }
    const { palaceId, journeyId } = req.body;
    if (!palaceId || !journeyId) {
      return res.status(400).json({
        success: false,
        message: "Palace ID and journey ID are required.",
      });
    }

    // Verify that the destination exists and is approved.
    const palace = await Palace.findOne({
      _id: palaceId,
      status: "approved",
    });

    if (!palace) {
      return res.status(404).json({
        success: false,
        message: "Approved palace not found.",
      });
    }

    // Create a unique arrival record before sending the notification.
    // This prevents duplicate requests for the same journey.
    let arrival;

    try {
      arrival = await JourneyArrival.create({
        journeyId,
        user: req.user._id,
        palace: palace._id,
        notificationStatus: "pending",
      });
      console.log("Journey arrival document saved:", arrival._id);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(200).json({
          success: true,
          alreadyNotified: true,
          message: "Arrival notification was already processed.",
        });
      }

      throw error;
    }

    try {
      const result = await sendUserPush(req.user._id, {
        title: "You reached your destination!",
        message: `You have successfully reached ${palace.name}. Enjoy your visit!`,
        url: "/",
        tag: `journey-arrival-${journeyId}`,
      });

      if (!result || result.sent === 0) {
        await JourneyArrival.findByIdAndUpdate(arrival._id, {
          notificationStatus: "failed",
        });

        return res.status(200).json({
          success: true,
          notificationSent: false,
          message:
            "Arrival recorded, but no push notification could be delivered. Please enable notifications.",
        });
      }

      await JourneyArrival.findByIdAndUpdate(arrival._id, {
        notificationStatus: "sent",
        notificationSentAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        notificationSent: true,
        message: "Arrival notification sent successfully.",
      });
    } catch (pushError) {
      console.error("Journey arrival push error:", pushError);

      await JourneyArrival.findByIdAndUpdate(arrival._id, {
        notificationStatus: "failed",
      });

      return res.status(200).json({
        success: true,
        notificationSent: false,
        message: "Arrival recorded, but notification delivery failed.",
      });
    }
  } catch (error) {
    console.error("Journey arrival error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process journey arrival.",
    });
  }
};

module.exports = { notifyJourneyArrival };