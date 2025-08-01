// models/Reply.js
const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notificationId: { type: mongoose.Schema.Types.ObjectId, ref: "Notification", required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Reply", replySchema);
