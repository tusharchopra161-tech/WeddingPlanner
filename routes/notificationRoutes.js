
const express = require("express");
const router = express.Router();

const {getMyNotifications,markNotificationRead,markAllNotificationsRead,} = require("../controllers/notificationContrller");
// Use the same authentication middleware used by your booking routes.
const authMiddleware  = require("../middleware/authMiddelware");
router.get("/my", authMiddleware, getMyNotifications);
router.patch("/read-all", authMiddleware, markAllNotificationsRead);
router.patch("/:id/read", authMiddleware, markNotificationRead);

module.exports = router;
