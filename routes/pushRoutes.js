const router=require("express").Router()
const authenticateAdmin= require("../middleware/authenticateAdminMiddelware");
const {ggetPublicKey,enableNotification,removeNotification}=require("../controllers/pushNotifiController")
// Frontend needs this public key to subscribe.
// The public key is not a secret.
router.get("/public-key",ggetPublicKey);
// Save this admin's device subscription
router.post("/subscribe",authenticateAdmin,enableNotification);
// Allow an admin to remove their current device subscription
router.delete("/subscribe",authenticateAdmin,removeNotification);

module.exports = router;