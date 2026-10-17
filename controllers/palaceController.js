const Palace = require("../models/palaceModels")
const sendAdminPush = require("../utils/sendAdminPush");
const createPalace = async (req, res) => {
  try {
    const {
      // owner,
      Images,
      name,
      location,
      description,
      price,
      capacity,
      facilities,
      isAvailable,
    } = req.body;
    if (!name || !location || price == null || capacity == null) {
      return res.status(400).json({
        success: false,
        message: "Name, location, price, and capacity are required",
      });
    }
    const palace = await Palace.create({
      owner: req.user.userId,
      Images,
      name,
      location,
      description,
      price,
      capacity,
      facilities,
      isAvailable,
      status: "pending"
    })
    // Send a event after saving the palace
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
      // A push failure must not undo the saved palace.
      console.error("Failed to send palace push:", error.message);
    }
    res.status(201).json({
      success: true,
      message: "palace is submitted for admin approval",
      palace
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "faild create to palace"
    })
  }

}
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
      { new: true, runValidators: true }
    );

    if (!palace) {
      return res.status(404).json({
        success: false,
        message: "Palace not found",
      });
    }

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
}
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

module.exports = { createPalace, getPalace, getPalaceById, updatePalace, deletePalace, updatePalaceStatus, getPendingPalaces, getMyPalace }


