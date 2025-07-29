const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/library-management", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("MongoDB connected successfully")
  } catch (error) {
    console.error("Database connection error:", error)
    process.exit(1)
  }
}

connectDB()
