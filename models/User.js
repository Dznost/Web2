const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["student", "teacher", "reader", "librarian", "admin"],
        default: "reader",
    },
    borrowHistory: [
        {
            bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
            bookTitle: String,
            borrowDate: Date,
            returnDate: Date,
            actualReturnDate: Date,
            status: { type: String, enum: ["borrowed", "returned", "overdue"], default: "borrowed" },
            fine: { type: Number, default: 0 },
        },
    ],
    bannedUntil: {
        type: Date,
        default: null,
    },
    bannedReason: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    try {
        this.password = await bcrypt.hash(this.password, 10)
        console.log(`[User Model] Hashed password for ${this.username}: ${this.password.substring(0, 20)}...`)
        next()
    } catch (error) {
        console.error("[User Model] Error hashing password:", error)
        next(error)
    }
})

userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        console.log(`[User Model] Comparing password for ${this.username}:`)
        console.log(`  Candidate Password (input): ${candidatePassword}`)
        console.log(`  Stored Hashed Password: ${this.password.substring(0, 20)}...`)
        const isMatch = await bcrypt.compare(candidatePassword, this.password)
        console.log(`  Comparison Result: ${isMatch ? "MATCH" : "NO MATCH"}`)
        return isMatch
    } catch (error) {
        console.error("[User Model] Error comparing password:", error)
        return false
    }
}

userSchema.methods.isBanned = function () {
    return this.bannedUntil && this.bannedUntil > new Date()
}

userSchema.methods.canBorrow = function () {
    if (this.isBanned()) return false

    const activeBorrows = this.borrowHistory.filter((h) => h.status === "borrowed").length

    switch (this.role) {
        case "student":
            return activeBorrows < 3
        case "teacher":
            return activeBorrows < 5
        case "reader":
            return activeBorrows < 3
        default:
            return activeBorrows < 3
    }
}

module.exports = mongoose.model("User", userSchema)
