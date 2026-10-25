
const router = require("express").Router();

const {
    createBooking,
    getMyBookings,
    getOwnerBookingRequests,
    updateBookingStatus,
    getPalaceAvailability,
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
router.get("/palace/:palaceId/availability",getPalaceAvailability);
module.exports = router;