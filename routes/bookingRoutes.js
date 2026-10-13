const router=require("express").Router();
const {
  createBooking,
  getMyBookings,
  getOwnerBookingRequests,
  updateBookingStatus,
} = require("../controllers/bookingController.js");

router.post("/", createBooking);
router.get("/my-bookings",getMyBookings);
router.get("/owner-requests",getOwnerBookingRequests);
router.patch("/:bookingId/status",updateBookingStatus);

module.exports= router;