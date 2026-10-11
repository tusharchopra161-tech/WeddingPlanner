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
    },
    password: {
        type: String,
        minlength: 6,
        unique:true,
        required: true
    },
    role:{
        type:String,
        enum:["user","owner","admin"],
        default:"user"
    },
    isActive:{
        type:String,
        default:true
    },
    subsciption:{
        isSubscribe:{
            type:Boolean,
            default:false
        },
        plan:{
            type:String,
            enum:["free","premium"],
            default:"free"
        },
        expresAt:{
            type:Date,
            default:null
        }
    }
},
    {
        timestamps: true
    })
const User = mongoose.model("User", userSchema)
module.exports = User