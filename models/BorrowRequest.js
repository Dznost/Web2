const mongoose = require("mongoose");

const borrowRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    bookCode: {
        type: String,
        required: true,
    },
    bookTitle: {
        type: String,
        required: true,
    },
    branch: {
        type: String,
        enum: ["A", "B", "C", "D"],
        required: true,
    },
    requestDate: {
        type: Date,
        default: Date.now,
    },
    expectedReceiveDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "borrowed", "returned", "cancelled"],
        default: "pending",
    },
    confirmationCode: {
        type: String,
        sparse: true, // Cho phép null values không bị duplicate
    },
    borrowDate: Date,
    returnDate: Date,
    actualReturnDate: Date,
    fine: {
        type: Number,
        default: 0,
    },
    notes: String,
});

// Generate confirmation code before saving
borrowRequestSchema.pre("save", function (next) {
    if (!this.confirmationCode && this.isNew) {
        this.confirmationCode = "BR" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    next();
});

module.exports = mongoose.model("BorrowRequest", borrowRequestSchema);