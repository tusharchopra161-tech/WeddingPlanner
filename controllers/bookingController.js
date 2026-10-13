const Booking=require("../models/bookingModels.js")
const Palace = require("../models/palaceModels.js");

 const createBooking = async (req, res) => {
  
    const { palaceId, weddingDate, guestCount, specialRequests } = req.body;
    console.log("Collection:", Palace.collection.name);
    
    
    if (!palaceId || !weddingDate || !guestCount) {
      return res.status(400).json({
        success: false,
        message: "Palace, wedding date, and guest count are required",
      });
    }
    const guests = Number(guestCount);
    const date = new Date(weddingDate);
    if (!Number.isFinite(guests) || !Number.isInteger(guests) || guests < 1) {
      return res.status(400).json({
        success: false,
        message: "Guest count must be a positive whole number",
      });
    }

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid future wedding date",
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

    // Optional guest capacity validation
    if (palace.maxGuests && guests > palace.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `This palace can accommodate up to ${palace.maxGuests} guests`,
      });
    }

    // Prevent booking a date already reserved by a confirmed booking
    const existingBooking = await Booking.findOne({
      palace: palaceId,
      weddingDate: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(weddingDate).setHours(24, 0, 0, 0)),
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
      user: req.body.userId,
      palace: palaceId,
      weddingDate,
      guestCount: guests,
      totalPrice: palace.price,
      specialRequests: specialRequests || "",
    });

    return res.status(201).json({
      success: true,
      message: "Booking request submitted successfully",
      booking,
    });
  
};


 const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
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
    // Assumes Palace has an `owner` field referencing the User model
    const palaces = await Palace.find({
      owner: req.user.id,
    }).select("_id");

    const palaceIds = palaces.map((palace) => palace._id);

    const bookings = await Booking.find({
      palace: { $in: palaceIds },
    })
      .populate("user", "name email")
      .populate("palace", "name location price")
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
        message: "Status must be confirmed or rejected",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify that the logged-in owner owns this palace
    const palace = await Palace.findOne({
      _id: booking.palace,
      owner: req.user.id,
    });

    if (!palace) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage this booking",
      });
    }

    if (booking.bookingStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be updated",
      });
    }

    // Check again before confirming to avoid date conflicts
    if (bookingStatus === "confirmed") {
      const start = new Date(booking.weddingDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        palace: booking.palace,
        weddingDate: { $gte: start, $lt: end },
        bookingStatus: "confirmed",
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "Another booking is already confirmed for this date",
        });
      }
    }

    booking.bookingStatus = bookingStatus;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Booking ${bookingStatus} successfully`,
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports={updateBookingStatus,createBooking,getMyBookings,getOwnerBookingRequests}