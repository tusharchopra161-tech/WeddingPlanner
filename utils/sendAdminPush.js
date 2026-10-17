const webpush = require("web-push");

const PushSubscription = require("../models/pushSubscriptionModel");

if (
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY );
}

const sendAdminPush = async (payload) => {
  if (!process.env.VAPID_PUBLIC_KEY ||!process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    console.error("VAPID environment variables are missing");
    return;
  }

  const subscriptions = await PushSubscription.find().populate("user", "role");

  const adminSubscriptions = subscriptions.filter((item) => item.user?.role === "admin");

  const results = await Promise.allSettled(
    adminSubscriptions.map(async (item) => {
      try {
        await webpush.sendNotification(
          item.subscription,
          JSON.stringify(payload)
        );
      } catch (error) {
        // Remove expired or invalid subscriptions.
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({
            _id: item._id,
          });
          return;
        }

        throw error;
      }
    })
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "Push delivery failed:",
        result.reason?.message
      );
    }
  });
};

module.exports = sendAdminPush;