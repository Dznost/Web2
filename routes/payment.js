const express = require("express");
const router = express.Router();
const { requireAuth, requireLibrarianOrAdmin } = require("../../middleware/auth");
const Borrow = require("../../models/Borrow");
const Book = require("../../models/Book");
const User = require("../../models/User");

router.use(requireAuth);
router.use(requireLibrarianOrAdmin);

// GET: Hiển thị form nhập mã sách
router.get("/payment", (req, res) => {
    res.render("librarian/payment", { title: "Tính phí thanh toán", result: null });
});

// POST: Tính toán phí
router.post("/payment", async (req, res) => {
    const { code } = req.body;
    try {
        const borrow = await Borrow.findOne({ code }).populate("bookId userId");

        if (!borrow) {
            return res.render("librarian/payment", {
                title: "Tính phí thanh toán",
                error: "Không tìm thấy bản ghi mượn sách với mã đã nhập.",
                result: null
            });
        }

        const today = new Date();
        const returnDate = borrow.returnDate ? new Date(borrow.returnDate) : today;
        const borrowDate = new Date(borrow.borrowDate);
        const daysBorrowed = Math.ceil((returnDate - borrowDate) / (1000 * 60 * 60 * 24));

        let fee = 0;
        let overdue = 0;
        let normalFee = 0;

        const role = borrow.userId.role;

        if (role === "student") {
            overdue = Math.max(0, daysBorrowed - 7);
            normalFee = Math.min(daysBorrowed, 7) * 1000;
            fee = normalFee + overdue * 5000;
        } else if (role === "teacher") {
            fee = 0;
        } else {
            overdue = Math.max(0, daysBorrowed - 7);
            normalFee = Math.min(daysBorrowed, 7) * 1000;
            fee = normalFee + overdue * 10000;
        }

        const result = {
            fullName: borrow.userId.fullName,
            bookTitle: borrow.bookId.title,
            borrowDate: borrow.borrowDate,
            returnDate: borrow.returnDate || "Chưa trả",
            daysBorrowed,
            role,
            fee,
        };

        res.render("librarian/payment", { title: "Kết quả thanh toán", result });
    } catch (err) {
        console.error("❌ Error in /payment:", err);
        res.status(500).send("Lỗi server khi tính toán phí thanh toán.");
    }
});

module.exports = router;
