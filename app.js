const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const multer = require("multer");
const connectDB = require("./config/database");
const unreadNotifications = require("./middleware/unreadNotifications");

const app = express();

// ======= DB Connect ========
connectDB();

// ======= Multer config ========
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
app.locals.upload = upload;

// ======= Middleware ========
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======= Session ========
const mongoUrl = "mongodb+srv://fuibui3:123456%40@cluster0.jnhped4.mongodb.net/library-management?retryWrites=true&w=majority";
app.use(
    session({
        secret: "library-secret-key-2024",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl }),
        cookie: { maxAge: 24 * 60 * 60 * 1000 },
    })
);

// ======= View engine ========
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ======= Global locals ========
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ======= Middleware sau khi session có ========
app.use(unreadNotifications);

// ======= Routes ========
console.log("Before requiring routes");
app.use("/auth", require("./routes/auth"));
app.use("/books", require("./routes/books"));
app.use("/user", require("./routes/user"));
console.log("Before requiring admin route");
app.use("/admin", require("./routes/admin"));
console.log("After requiring admin route");
app.use("/librarian", require("./routes/librarian"));
app.use("/notifications", require("./routes/notifications"));
app.use("/api", require("./routes/api"));


// ======= Trang chủ ========
app.get("/", async (req, res) => {
    try {
        const Book = require("./models/Book");
        const books = await Book.find({ quantity: { $gt: 0 } })
            .limit(12)
            .sort({ createdAt: -1 });

        res.render("books/index", {
            books,
            title: "Thư viện trực tuyến",
            currentSearch: "",
            currentGenre: "all",
            currentSort: "newest",
            genres: await Book.distinct("genre"),
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// ======= Start Server ========
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});