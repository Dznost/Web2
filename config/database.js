const mongoose = require("mongoose")

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://fuibui3:123456%40@cluster0.jnhped4.mongodb.net/library-management?retryWrites=true&w=majority", {
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
