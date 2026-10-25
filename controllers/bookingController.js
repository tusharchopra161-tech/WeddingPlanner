const Booking = require("../models/bookingModels.js")
const Palace = require("../models/palaceModels.js");

const createBooking = async (req, res) => {
  try {
    const { palaceId, weddingDate, guestCount, specialRequests } = req.body;

    if (!palaceId || !weddingDate || !guestCount) {
      return res.status(40).json({
        success: false,
        message: "Palace, wedding date, and guest count are required",
      });
    }
    if (!require("mongoose").isValidObjectId(palaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid palace ID"
      });
    }
    const guests = Number(guestCount);
    const date = new Date(weddingDate);
    if (!Number.isFinite(guests) || !Number.isSafeInteger(guests) || guests < 1) {
      return res.status(400).json({
        success: false,
        message: "Guest count must be a positive whole number",
      });
    }

    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() + 20);

    if (Number.isNaN(date.getTime()) || date < minDate) {
      return res.status(400).json({
        success: false,
        message: "Bookings must be made at least 20 days before the wedding date."
      });
    }

    const palace = await Palace.findOne({
      _id: palaceId,
      status: "approved",
    });

    if (!palace) {
      return res.status(404).json({
        success: false,
        message: "Approved palace not found",
      });
    }
    // Reject bookings when the entire palace is unavailable
    if (palace.isAvailable === false) {
      return res.status(409).json({
        success: false,
        message: "This palace is currently unavailable for bookings",
      });
    }

    // Reject bookings on dates blocked by the palace owner
    const requestedDate = date.toISOString().slice(0, 10);

    const isDateUnavailable = (palace.unavailableDates || []).some(
      (blockedDate) =>
        new Date(blockedDate).toISOString().slice(0, 10) === requestedDate
    );

    if (isDateUnavailable) {
      return res.status(409).json({
        success: false,
        message: "This palace is unavailable on the selected wedding date",
      });
    }
    // Optional guest capacity validation
    if (guests > Number(palace.capacity)) {
      return res.status(400).json({
        success: false,
        message: `This palace can accommodate up to ${palace.capacity} guests`,
      });
    }
    // Normalize the selected date to one calendar day.
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const nextDay = new Date(startOfDay);
    nextDay.setDate(nextDay.getDate() + 1);
    // Prevent booking a date already reserved by a confirmed booking
    const existingBooking = await Booking.findOne({
      palace: palaceId,
      weddingDate: {
        $gte: startOfDay,
        $lt: nextDay,
      },
      bookingStatus: "confirmed",
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "This palace is already booked for that date",
      });
    }

    const booking = await Booking.create({
      user: req.user.userId,
      palace: palaceId,
      weddingDate: startOfDay,
      guestCount: guests,
      totalPrice: Number(palace.price),
      specialRequests: typeof specialRequests === "string" ? specialRequests.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Booking request submitted successfully",
      booking,
    });
  } catch (err) {
    console.error("Create booking error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking"
    });
  }
};


const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.userId
    })
      .populate("palace")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getOwnerBookingRequests = async (req, res) => {
  try {

    const palaces = await Palace.find({
      owner: req.user.userId,
    }).select("_id");

    const palaceIds = palaces.map((palace) => palace._id);
    const bookings = await Booking.find({
      palace: { $in: palaceIds },
    })
      .populate("user", "name email")
      .populate("palace", "name location price capacity")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { bookingStatus } = req.body;

    if (!["confirmed", "rejected"].includes(bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be confirmed or rejected"
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Verify that this booking belongs to a palace owned by this owner
    const palace = await Palace.findOne({
      _id: booking.palace,
      owner: req.user.userId
    });

    if (!palace) {
      return res.status(403).json({
        success: false,
        message: "You cannot update bookings for another owner's palace"
      });
    }

    if (booking.bookingStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be updated"
      });
    }

    // Avoid confirming a booking if another confirmed booking exists
    if (bookingStatus === "confirmed") {
      // Prevent confirmation if the palace is unavailable
      if (palace.isAvailable === false) {
        return res.status(409).json({
          success: false,
          message: "This palace is currently unavailable",
        });
      }

      // Prevent confirmation if the owner blocked this wedding date
      const bookingDate = new Date(booking.weddingDate)
        .toISOString()
        .slice(0, 10);

      const isDateUnavailable = (palace.unavailableDates || []).some(
        (blockedDate) =>
          new Date(blockedDate).toISOString().slice(0, 10) === bookingDate
      );

      if (isDateUnavailable) {
        return res.status(409).json({
          success: false,
          message: "This wedding date has been marked unavailable by the owner",
        });
      }
      const startOfDay = new Date(booking.weddingDate);
      startOfDay.setHours(0, 0, 0, 0);

      const nextDay = new Date(startOfDay);
      nextDay.setDate(nextDay.getDate() + 1);

      const existingBooking = await Booking.findOne({
        _id: { $ne: booking._id },
        palace: booking.palace,
        weddingDate: {
          $gte: startOfDay,
          $lt: nextDay
        },
        bookingStatus: "confirmed"
      });

      if (existingBooking) {
        return res.status(409).json({
          success: false,
          message: "Another booking is already confirmed for this date"
        });
      }
    }

    booking.bookingStatus = bookingStatus;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Booking ${bookingStatus} successfully`,
      booking
    });

  } catch (error) {
    console.error("Update booking status error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update booking status"
    });
  }
};


module.exports = { updateBookingStatus, createBooking, getMyBookings, getOwnerBookingRequests }