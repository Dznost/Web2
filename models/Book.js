const mongoose = require("mongoose")

const bookSchema = new mongoose.Schema({
  bookId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "/images/default-book.jpg",
  },
  branches: {
    A: { type: Number, default: 0 },
    B: { type: Number, default: 0 },
    C: { type: Number, default: 0 },
    D: { type: Number, default: 0 },
  },
  quantity: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      comment: String,
      rating: { type: Number, min: 1, max: 5 },
      date: { type: Date, default: Date.now },
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Calculate total quantity from branches
bookSchema.pre("save", function (next) {
  this.quantity = this.branches.A + this.branches.B + this.branches.C + this.branches.D

  // Calculate average rating
  if (this.comments.length > 0) {
    const totalRating = this.comments.reduce((sum, comment) => sum + comment.rating, 0)
    this.averageRating = totalRating / this.comments.length
  }

  next()
})

module.exports = mongoose.model("Book", bookSchema)
