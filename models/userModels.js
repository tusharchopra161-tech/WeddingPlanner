const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    mobileno: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 10,
        match: /^[0-9]{10}$/
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        trim: true,
        lowercase: true,
        //   match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
        type: String,
        minlength: 6,
        required: true
    }
},
    {
        timestamps: true
    })
const User = mongoose.model("User", userSchema)
module.exports = User