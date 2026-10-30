
const router = require("express").Router();

const authenticateUser = require("../middleware/authenticateUserMiddleware");
const { notifyJourneyArrival,} = require("../controllers/arrivalController");

// Customer arrival notification
router.post("/",authenticateUser,notifyJourneyArrival);
module.exports = router;
