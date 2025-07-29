const mongoose = require("mongoose")

const bookRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  year: Number,
  genre: String,
  summary: String,
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  adminNotes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("BookRequest", bookRequestSchema)
