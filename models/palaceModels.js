const mongoose = require("mongoose");

const palaceSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    Images: [{
        type: String,
        required: true
    }],
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    coordinates:{
        latitude:{
            type:Number,
            min:-90,
            max:90,
            required:true
        },
        longitude:{
            type:Number,
            min:-180,
            max:180,
            required:true

        }
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    capacity: {
        type: Number,
        required: true,
        min: 100
    },
    facilities: [{ type: String }],
    isAvailable: {
        type: Boolean,
        default: true
    },
    unavailableDates:{
        type: [Date],
        default:[]
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    }
}, {
    timestamps: true
})
const Palace = mongoose.model("Palace", palaceSchema);
module.exports = Palace