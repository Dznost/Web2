const Book = require("../models/Book");
const BorrowRequest = require("../models/BorrowRequest");
const User = require("../models/User");
const Notification = require("../models/notification");

exports.getAllBooks = async (req, res) => {
    try {
        const { search, genre, sort } = req.query;
        const query = { quantity: { $gt: 0 } };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { author: { $regex: search, $options: "i" } },
                { bookId: { $regex: search, $options: "i" } },
            ];
        }

        if (genre && genre !== "all") {
            query.genre = genre;
        }

        let sortOption = { createdAt: -1 };
        if (sort === "title") sortOption = { title: 1 };
        if (sort === "author") sortOption = { author: 1 };
        if (sort === "year") sortOption = { year: -1 };
        if (sort === "rating") sortOption = { averageRating: -1 };

        const books = await Book.find(query).sort(sortOption);
        const genres = await Book.distinct("genre");

        res.render("books/index", {
            books: books || [],
            genres: genres || [],
            currentSearch: search || "",
            currentGenre: genre || "all",
            currentSort: sort || "newest",
            title: "Tra cứu sách",
        });
    } catch (error) {
        console.error(error);
        res.render("books/index", {
            books: [],
            genres: [],
            currentSearch: "",
            currentGenre: "all",
            currentSort: "newest",
            title: "Tra cứu sách",
            error: "Có lỗi xảy ra khi tải dữ liệu",
        });
    }
};

exports.getBookDetail = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate("comments.userId", "fullName");
        if (!book) {
            return res.status(404).render("error", {
                title: "Không tìm thấy sách",
                message: "Sách không tồn tại",
            });
        }

        const availableBranches = [];
        Object.keys(book.branches).forEach((branch) => {
            if (book.branches[branch] > 0) {
                availableBranches.push({ name: branch, quantity: book.branches[branch] });
            }
        });

        res.render("books/detail", {
            book,
            availableBranches,
            title: book.title,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

exports.addComment = async (req, res) => {
    try {
        const { comment, rating } = req.body;
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ error: "Sách không tồn tại" });
        }

        const existingComment = book.comments.find((c) => c.userId.toString() === req.session.user.id);
        if (existingComment) {
            return res.status(400).json({ error: "Bạn đã bình luận về sách này" });
        }

        book.comments.push({
            userId: req.session.user.id,
            username: req.session.user.fullName,
            comment,
            rating: Number.parseInt(rating),
        });

        await book.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
};

exports.showBorrowForm = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).render("error", {
                title: "Không tìm thấy sách",
                message: "Sách không tồn tại",
            });
        }

        const user = await User.findById(req.session.user.id);
        if (!user.canBorrow()) {
            return res.render("error", {
                title: "Không thể mượn sách",
                message: "Bạn đã đạt giới hạn mượn sách hoặc tài khoản bị cấm",
            });
        }

        const availableBranches = [];
        Object.keys(book.branches).forEach((branch) => {
            if (book.branches[branch] > 0) {
                availableBranches.push({ name: branch, quantity: book.branches[branch] });
            }
        });

        res.render("books/borrow", {
            book,
            availableBranches,
            user: req.session.user,
            title: `Đăng ký mượn: ${book.title}`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

exports.submitBorrowRequest = async (req, res) => {
    try {
        const { fullName, branch, expectedReceiveDate, agreeToRules } = req.body;

        if (!agreeToRules) {
            return res.status(400).json({ error: "Bạn phải đồng ý với quy định mượn sách" });
        }

        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ error: "Sách không tồn tại" });
        }

        if (book.branches[branch] <= 0) {
            return res.status(400).json({ error: "Chi nhánh này đã hết sách" });
        }

        const user = await User.findById(req.session.user.id);
        if (!user.canBorrow()) {
            return res.status(400).json({ error: "Bạn đã đạt giới hạn mượn sách hoặc tài khoản bị cấm" });
        }

        const expectedReceive = new Date(expectedReceiveDate);
        if (isNaN(expectedReceive.getTime())) {
            return res.status(400).json({ success: false, error: "Ngày dự kiến nhận sách không hợp lệ" });
        }

        const borrowRequest = new BorrowRequest({
            userId: req.session.user.id,
            bookId: book._id,
            fullName,
            bookCode: book.bookId,
            bookTitle: book.title,
            branch,
            expectedReceiveDate: expectedReceive,
        });

        await borrowRequest.save();

        book.branches[branch] -= 1;
        await book.save();

        await Notification.create({
            userId: req.session.user.id,
            message: `Yêu cầu mượn sách "${book.title}" tại chi nhánh ${branch} đã được gửi. Ngày dự kiến nhận: ${expectedReceive.toLocaleDateString()}`,
        });

        res.json({
            success: true,
            confirmationCode: borrowRequest.confirmationCode,
            message: "Đăng ký mượn sách thành công!",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server khi đăng ký mượn sách" });
    }
};