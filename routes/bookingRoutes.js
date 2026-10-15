// const router=require("express").Router();
// const {
//   createBooking,
//   getMyBookings,
//   getOwnerBookingRequests,
//   updateBookingStatus,
// } = require("../controllers/bookingController.js");

// router.post("/", createBooking);
// router.get("/user/:userId",getMyBookings);
// router.get("/owner/:ownerId",getOwnerBookingRequests);
// router.patch("/:bookingId/status",updateBookingStatus);

// module.exports= router;
const router = require("express").Router();

const {
    createBooking,
    getMyBookings,
    getOwnerBookingRequests,
    updateBookingStatus,
} = require("../controllers/bookingController.js");

const authMiddleware = require("../middleware/authMiddelware");
const allowRoles = require("../middleware/roleMiddelware");

// User: Create a booking
router.post("/", authMiddleware, allowRoles("user"), createBooking);

// User: Get their own bookings
router.get("/my", authMiddleware, allowRoles("user"), getMyBookings);

// Owner: Get booking requests for their palaces
router.get(
    "/owner",
    authMiddleware,
    allowRoles("owner"),
    getOwnerBookingRequests
);

// Owner: Accept or reject a booking request
router.patch(
    "/:bookingId/status",
    authMiddleware,
    allowRoles("owner"),
    updateBookingStatus
);

module.exports = router;