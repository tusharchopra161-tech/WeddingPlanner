const webpush = require("web-push");
const PushSubscription = require("../models/pushSubscriptionModel");

const sendUserPush = async (userId, payload) => {
  if (
    !process.env.VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.VAPID_SUBJECT
  ) {
    console.error("VAPID environment variables are missing");
    return;
  }
  if (!userId) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const subscriptions = await PushSubscription.find({
    user: userId,
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (item) => {
      try {
        await webpush.sendNotification(
          item.subscription,
          JSON.stringify({
            title: payload.title || "Wedding Planner",
            body: payload.message || payload.body || "You have a new notification.",
            url: payload.url || "/",
            tag: payload.tag || "wedding-planner-notification",
          })
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: item._id });
          return;
        }

        console.error(
          `Push failed for subscription ${item._id}:`,
          error.message
        );
        throw error;
      }
    })
  );

  const failed = results.filter(
    (result) => result.status === "rejected"
  ).length;

  if (failed > 0) {
    console.error(`Push delivery failed for ${failed} subscription(s).`);
  }

  return {
    sent: results.length - failed,
    failed,
  };
};

module.exports = sendUserPush;
