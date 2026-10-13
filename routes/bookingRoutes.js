const router=require("express").Router();
const {
  createBooking,
  getMyBookings,
  getOwnerBookingRequests,
  updateBookingStatus,
} = require("../controllers/bookingController.js");

router.post("/", createBooking);
router.get("/user/:userId",getMyBookings);
router.get("/owner/:ownerId",getOwnerBookingRequests);
router.patch("/:bookingId/status",updateBookingStatus);

module.exports= router;