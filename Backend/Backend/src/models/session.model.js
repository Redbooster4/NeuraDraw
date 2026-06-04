const mongoose = require("mongoose")

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "User is Required"]
    }, 
    refreshTokenHash: {
        type: String,
        required: [true, "Refresh Token is Required"]
    },
    ip: {
        type: String,
        required: [true, "IP address is Required"]
    },
    userAgent: {
        type: String,
        required: [true, "Access Agent is Required"]
    },
    revoked: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
})
const sessionModel = mongoose.model("session", sessionSchema)

module.exports = sessionModel;