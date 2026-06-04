const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({
    email: {
        type: String, 
        required: [true, "Email is required"],
        trim: true,
        lowercase: true
    },
    otpHash: {
        type: String, 
        required: [true, "OTP Hash is required"]
    },
    username: {
        type: String,
        required: [true, "Username is required"]
    },
    passwordHash: {
        type: String,
        required: [true, "Password hash is required"]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600,
    }
}, {
    timestamps: true
});
const otpModel = mongoose.model("otp", otpSchema);

module.exports = otpModel;