const express = require("express")
const mongoose = require("mongoose")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const path = require("path")
const multer = require("multer")

const app = express()

// Database connection
require("./config/database")

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/")
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    },
})

const upload = multer({ storage: storage })
app.locals.upload = upload

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Session configuration
app.use(
    session({
        secret: "library-secret-key-2024",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: "mongodb://localhost:27017/library-management", // Đảm bảo đúng tên database
        }),
        cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    }),
)

// View engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Global middleware for user session
app.use((req, res, next) => {
    res.locals.user = req.session.user || null
    next()
})

// Routes
app.use("/auth", require("./routes/auth"))
app.use("/books", require("./routes/books"))
app.use("/user", require("./routes/user"))
app.use("/admin", require("./routes/admin"))
app.use("/librarian", require("./routes/librarian"))

// Home route
app.get("/", async (req, res) => {
    try {
        const Book = require("./models/Book")
        const books = await Book.find({ quantity: { $gt: 0 } })
            .limit(12)
            .sort({ createdAt: -1 })
        res.render("books/index", {
            books,
            title: "Thư viện trực tuyến",
            currentSearch: "",
            currentGenre: "all",
            currentSort: "newest",
            genres: await Book.distinct("genre"),
        })
    } catch (error) {
        console.error(error)
        res.status(500).send("Server Error")
    }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Visit: http://localhost:${PORT}`)
})
