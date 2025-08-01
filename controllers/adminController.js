const fs = require("fs");
const path = require("path");
const Book = require("../models/Book");
const BookRequest = require("../models/BookRequest");
const User = require("../models/User");
const BorrowRequest = require("../models/BorrowRequest");
const Notification = require("../models/notification");

exports.showAddBook = (req, res) => {
    res.render("admin/add-book", { title: "Thêm sách mới" });
};

exports.addBook = async (req, res) => {
    try {
        const { bookId, title, author, year, genre, summary, branchA, branchB, branchC, branchD } = req.body;

        const existingBook = await Book.findOne({ bookId });
        if (existingBook) return res.status(400).json({ error: "Mã sách đã tồn tại" });

        const book = new Book({
            bookId,
            title,
            author,
            year: Number.parseInt(year),
            genre,
            summary,
            branches: {
                A: Number.parseInt(branchA) || 0,
                B: Number.parseInt(branchB) || 0,
                C: Number.parseInt(branchC) || 0,
                D: Number.parseInt(branchD) || 0,
            },
            image: req.file ? `/uploads/${req.file.filename}` : "/images/default-book.jpg",
        });

        await book.save();
        res.json({ success: true, message: "Thêm sách thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
};

exports.showDistribute = async (req, res) => {
    try {
        const books = await Book.find().sort({ title: 1 });
        res.render("admin/distribute", { books, title: "Phân bố sách" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

exports.updateDistribution = async (req, res) => {
    try {
        const { bookId, branchA, branchB, branchC, branchD } = req.body;

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ error: "Không tìm thấy sách" });

        const originalTotal =
            (book.branches.A || 0) +
            (book.branches.B || 0) +
            (book.branches.C || 0) +
            (book.branches.D || 0);

        const newA = parseInt(branchA) || 0;
        const newB = parseInt(branchB) || 0;
        const newC = parseInt(branchC) || 0;
        const newD = parseInt(branchD) || 0;

        if (newA < 0 || newB < 0 || newC < 0 || newD < 0) {
            return res.status(400).json({ error: "Số lượng sách tại chi nhánh không thể âm" });
        }

        const newTotal = newA + newB + newC + newD;

        if (newTotal !== originalTotal) {
            return res.status(400).json({
                error: `Tổng phân bố mới (${newTotal}) phải bằng đúng tổng số sách đã thêm (${originalTotal}).`,
            });
        }

        book.branches = { A: newA, B: newB, C: newC, D: newD };

        await book.save();
        res.json({ success: true, message: "Cập nhật phân bố sách thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server khi cập nhật phân bố sách" });
    }
};

exports.showStatistics = async (req, res) => {
    try {
        const bookRequests = await BookRequest.find().sort({ createdAt: -1 });
        res.render("admin/statistics", { bookRequests, title: "Thống kê sách cần mua" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

exports.updateBookRequestStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const bookRequest = await BookRequest.findById(req.params.id);
        if (!bookRequest) return res.status(404).json({ error: "Không tìm thấy yêu cầu" });

        bookRequest.status = status;
        bookRequest.adminNotes = adminNotes;
        await bookRequest.save();

        await Notification.create({
            userId: bookRequest.userId,
            message: `Yêu cầu sách "${bookRequest.title}" của bạn đã được ${status === 'approved' ? 'phê duyệt' : 'từ chối'}.`,
        });

        res.json({ success: true, message: "Cập nhật trạng thái thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
};

exports.showBanUser = async (req, res) => {
    try {
        const users = await User.find({ role: { $nin: ["admin", "librarian"] } }).sort({ fullName: 1 });
        res.render("admin/ban-user", { users, title: "Cấm người dùng" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

exports.getUserHistory = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

        const borrowRequests = await BorrowRequest.find({ userId: user._id }).populate("bookId").sort({ requestDate: -1 });
        res.json({ user, borrowRequests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
};

exports.banUser = async (req, res) => {
    try {
        const { days, reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + Number.parseInt(days));
        user.bannedUntil = banUntil;
        user.bannedReason = reason;
        await user.save();

        res.json({ success: true, message: "Cấm người dùng thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
};

exports.unbanUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

        user.bannedUntil = null;
        user.bannedReason = null;
        await user.save();

        res.json({ success: true, message: "Bỏ cấm người dùng thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ error: "Không tìm thấy sách" });

        const activeBorrowRequests = await BorrowRequest.countDocuments({
            bookId: book._id,
            status: { $in: ["pending", "approved", "borrowed"] },
        });
        if (activeBorrowRequests > 0) {
            return res.status(400).json({ error: "Không thể xóa sách vì đang được mượn hoặc chờ xử lý." });
        }

        if (book.image && book.image !== "/images/default-book.jpg") {
            const imagePath = path.join(__dirname, "..", "public", book.image);
            fs.unlink(imagePath, err => err && console.error("Lỗi khi xóa ảnh:", err));
        }

        await book.deleteOne();
        await BookRequest.deleteMany({ bookId: book._id });
        await BorrowRequest.deleteMany({ bookId: book._id, status: { $nin: ["borrowed", "pending", "approved"] } });

        res.json({ success: true, message: "Xóa sách thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server khi xóa sách" });
    }
};

exports.showEditBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).render("error", { title: "Không tìm thấy sách", message: "Sách không tồn tại để chỉnh sửa." });
        }
        res.render("admin/edit-book", { book, title: `Chỉnh sửa sách: ${book.title}` });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

exports.updateBook = async (req, res) => {
    try {
        const { title, author, year, genre, summary, branchA, branchB, branchC, branchD, existingImage } = req.body;
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ error: "Không tìm thấy sách" });

        const originalTotal =
            (book.branches.A || 0) +
            (book.branches.B || 0) +
            (book.branches.C || 0) +
            (book.branches.D || 0);

        const newA = parseInt(branchA) || 0;
        const newB = parseInt(branchB) || 0;
        const newC = parseInt(branchC) || 0;
        const newD = parseInt(branchD) || 0;

        if (newA < 0 || newB < 0 || newC < 0 || newD < 0) {
            return res.status(400).json({ error: "Số lượng sách tại chi nhánh không thể âm" });
        }

        const newTotal = newA + newB + newC + newD;

        if (newTotal !== originalTotal) {
            return res.status(400).json({
                error: `Tổng phân bố mới (${newTotal}) phải bằng đúng tổng số sách đã thêm (${originalTotal}).`,
            });
        }

        book.title = title;
        book.author = author;
        book.year = Number.parseInt(year);
        book.genre = genre;
        book.summary = summary;
        book.branches = {
            A: newA,
            B: newB,
            C: newC,
            D: newD,
        };

        if (req.file) {
            if (book.image && book.image !== "/images/default-book.jpg") {
                const oldImagePath = path.join(__dirname, "..", "public", book.image);
                fs.unlink(oldImagePath, err => err && console.error("Lỗi khi xóa ảnh cũ:", err));
            }
            book.image = `/uploads/${req.file.filename}`;
        } else if (existingImage === "default") {
            if (book.image && book.image !== "/images/default-book.jpg") {
                const oldImagePath = path.join(__dirname, "..", "public", book.image);
                fs.unlink(oldImagePath, err => err && console.error("Lỗi khi xóa ảnh cũ:", err));
            }
            book.image = "/images/default-book.jpg";
        }

        await book.save();
        res.json({ success: true, message: "Cập nhật sách thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server khi cập nhật sách" });
    }
};