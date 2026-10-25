const Palace = require("../models/palaceModels")
const cloudinary = require("../config/coudinary")
const {Readable} = require("stream")
const sendAdminPush = require("../utils/sendAdminPush");

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "weddingplanner/palaces",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result.secure_url);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};
const createPalace = async (req, res) => {
  try {
    const {
      name,
      location,
      description,
      price,
      capacity,
      facilities,
      isAvailable,
    } = req.body;

    const files = req.files || [];

    if (
      !name?.trim() ||
      !location?.trim() ||
      !description?.trim() ||
      price == null ||
      capacity == null
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required venue details",
      });
    }

    if (
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(capacity)) ||
      Number(capacity) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid price and capacity",
      });
    }

    if (files.length < 5 || files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Please upload between 5 and 10 palace photos",
      });
    }

    // Upload all selected photos to Cloudinary
    const imageUrls = await Promise.all(
      files.map((file) => uploadToCloudinary(file))
    );

    // FormData sends facilities as a string
    let parsedFacilities = facilities || [];

    if (typeof parsedFacilities === "string") {
      parsedFacilities = JSON.parse(parsedFacilities);
    }

    if (!Array.isArray(parsedFacilities)) {
      return res.status(400).json({
        success: false,
        message: "Facilities must be an array",
      });
    }

    const palace = await Palace.create({
      owner: req.user.userId,
      Images: imageUrls,
      name: name.trim(),
      location: location.trim(),
      description: description.trim(),
      price: Number(price),
      capacity: Number(capacity),
      facilities: parsedFacilities,
      isAvailable: isAvailable === undefined
        ? true
        : isAvailable === "false" ? false : isAvailable,
      status: "pending",
    });

    
    const io = req.app.get("io");

    if (io) {
      io.to("admins").emit("new-palace", {
        message: "A new palace has been submitted for approval",
        palace,
      });
    }

    try {
      await sendAdminPush({
        title: "Wedding Planner",
        body: `${palace.name} has been submitted for admin approval.`,
        url: "/admin-dashboard",
        tag: `new-palace-${palace._id}`,
      });
    } catch (error) {
      console.error("Failed to send palace push:", error.message);
    }

    return res.status(201).json({
      success: true,
      message: "Palace submitted for admin approval",
      palace,
    });
  } catch (err) {
    console.error("Create palace error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create palace",
    });
  }
};
const getPalace = async (req, res) => {
  try {
    const palace = await Palace.find({ status: "approved" });

    return res.status(200).json({
      success: true,
      message: "Approved palaces fetched successfully",
      palace,
    });
  } catch (err) {
    console.error("Get palace error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch palaces",
    });
  }
};
const getPalaceById = async (req, res) => {
  try {
    const palace = await Palace.findById(req.params.id);

    if (!palace) {
      return res.status(404).json({
        success: false,
        message: "Palace not found",
      });
    }

    return res.status(200).json({
      success: true,
      palace,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch palace",
    });
  }
}
const updatePalace = async (req, res) => {
  try {
    const palace = await Palace.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!palace) {
      return res.status(404).json({
        success: false,
        message: "Palace not found or you do not own this palace",
      });
    }

    const allowedFields = [
      "Images",
      "name",
      "location",
      "description",
      "price",
      "capacity",
      "facilities",
      "isAvailable",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        palace[field] = req.body[field];
      }
    });

    await palace.save();

    return res.status(200).json({
      success: true,
      message: "Palace updated successfully",
      palace,
    });
  } catch (err) {
    console.error("Update palace error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update palace",
    });
  }
}
const deletePalace = async (req, res) => {
  try {
    const palace = await Palace.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!palace) {
      return res.status(404).json({
        success: false,
        message: "Palace not found or you do not own this palace",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Palace deleted successfully",
    });
  } catch (err) {
    console.error("Delete palace error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete palace",
    });
  }
}

const updatePalaceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected",
      });
    }

    const palace = await Palace.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after", runValidators: true }
    );

    if (!palace) {
      return res.status(404).json({
        success: false,
        message: "Palace not found",
      });
    }

    // Notify only the owner of this palace
    const io = req.app.get("io");
    const ownerId = palace.owner.toString();

    io.to(`owner:${ownerId}`).emit("palace-status-updated", {
      palaceId: palace._id.toString(),
      status: palace.status,
      message: `Your palace "${palace.name}" has been ${palace.status}.`,
      palace,
    });
    return res.status(200).json({
      success: true,
      message: `Palace ${status} successfully`,
      palace,
    });
  } catch (err) {
    console.error("Palace approval error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update palace status",
    });
  }
};

const getPendingPalaces = async (req, res) => {
  try {
    const palaces = await Palace.find({ status: "pending" })
      .populate("owner", "name email");

    return res.status(200).json({
      success: true,
      message: "Pending palaces fetched successfully",
      palaces,
    });
  } catch (err) {
    console.error("Get pending palaces error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending palaces",
    });
  }
}
const getMyPalace = async (req, res) => {
  try {
    const palace = await Palace.find({
      owner: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      palace,
      message: palace
        ? "Your palace fetched successfully"
        : "You have not created a palace yet",
    });
  } catch (err) {
    console.error("Get my palace error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your palace",
    });
  }
};
const updatePalaceAvailability = async (req, res) => {
  try {
    const { date, unavailable } = req.body;

    if (!date || typeof unavailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date and availability status",
      });
    }

    // Validate the date format and actual date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must use YYYY-MM-DD format",
      });
    }

    const selectedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid calendar date",
      });
    }

    // Only allow the owner to update their own palace
    const palace = await Palace.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!palace) {
      return res.status(404).json({
        success: false,
        message: "Palace not found or you do not own this palace",
      });
    }

    const dateExists = palace.unavailableDates.some(
      (blockedDate) =>
        new Date(blockedDate).toISOString().slice(0, 10) === date
    );

    if (unavailable && !dateExists) {
      palace.unavailableDates.push(selectedDate);
    }

    if (!unavailable && dateExists) {
      palace.unavailableDates = palace.unavailableDates.filter(
        (blockedDate) =>
          new Date(blockedDate).toISOString().slice(0, 10) !== date
      );
    }

    await palace.save();

    return res.status(200).json({
      success: true,
      message: unavailable
        ? "Date marked unavailable"
        : "Date marked available",
      unavailableDates: palace.unavailableDates,
    });
  } catch (err) {
    console.error("Update palace availability error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update palace availability",
    });
  }
};

module.exports = { createPalace, getPalace, getPalaceById, updatePalace, deletePalace, updatePalaceStatus, getPendingPalaces, getMyPalace, updatePalaceAvailability }


