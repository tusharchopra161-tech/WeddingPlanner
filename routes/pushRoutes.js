const { getPublicKey } = require("../controllers/pushNotifiController");
const authenticateAdmin= require("../middleware/authenticateAdminMiddelware");
const {getPublicKey,enableNotification,removeNotification}=require("../controllers/pushNotifiController")
// Frontend needs this public key to subscribe.
// The public key is not a secret.
router.get("/public-key",getPublicKey);
// Save this admin's device subscription
router.post("/subscribe",authenticateAdmin,enableNotification);
// Allow an admin to remove their current device subscription
router.delete("/subscribe",authenticateAdmin,removeNotification);

module.exports = router;