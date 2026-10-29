const router=require("express").Router()
const authenticateUser=require("../middleware/authenticateUserMiddleware")
// const authenticateAdmin= require("../middleware/authenticateAdminMiddelware");
const {ggetPublicKey,enableNotification,removeNotification}=require("../controllers/pushNotifiController");
// Frontend needs this public key to subscribe.
// The public key is not a secret.
router.get("/public-key",ggetPublicKey);
// Save this admin's device subscription
router.post("/subscribe",authenticateUser,enableNotification);
// Allow an admin to remove their current device subscription
router.delete("/subscribe",authenticateUser,removeNotification);

module.exports = router;