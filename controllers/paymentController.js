// controllers/paymentController.js
const BorrowRequest = require("../models/BorrowRequest");
const User = require("../models/User");
const Book = require("../models/Book");

exports.showPaymentForm = (req, res) => {
    res.render("librarian/payment", {
        title: "Thanh toán",
        result: null,
        error: null
    });
};

exports.calculatePayment = async (req, res) => {
    try {
        let { confirmationCode } = req.body;

        if (!confirmationCode || typeof confirmationCode !== "string") {
            return res.render("librarian/payment", {
                title: "Thanh toán",
                result: null,
                error: "❌ Mã xác nhận không hợp lệ hoặc bị thiếu."
            });
        }

        confirmationCode = confirmationCode.trim().replace(/[, ]/g, "");

        const borrow = await BorrowRequest.findOne({ confirmationCode })
            .populate("userId")
            .populate("bookId");

        if (!borrow) {
            return res.render("librarian/payment", {
                title: "Thanh toán",
                result: null,
                error: "❌ Không tìm thấy mã xác nhận."
            });
        }

        const role = (borrow.userId.role || "").trim();
        const borrowDate = new Date(borrow.borrowDate || borrow.pickupDate || borrow.requestDate);
        const returnDate = new Date(borrow.actualReturnDate || new Date());

        const days = Math.ceil((returnDate - borrowDate) / (1000 * 60 * 60 * 24));
        let totalFee = 0;

        switch (role) {
            case "student":
                totalFee = days > 7 ? (7 * 1000) + ((days - 7) * 5000) : days * 1000;
                break;
            case "teacher":
                totalFee = days * 1000; // không bị phạt
                break;
            default:
                totalFee = days > 7 ? (7 * 1000) + ((days - 7) * 10000) : days * 1000;
        }

        const result = {
            bookTitle: borrow.bookTitle || borrow.bookId?.title,
            userName: borrow.fullName || borrow.userId?.fullName || borrow.userId?.username,
            userRole: role,
            borrowDate: borrowDate.toLocaleDateString("vi-VN"),
            returnDate: returnDate.toLocaleDateString("vi-VN"),
            totalFee
        };

        res.render("librarian/payment", {
            title: "Thanh toán",
            result,
            error: null
        });
    } catch (err) {
        console.error("❌ Lỗi tính phí:", err);
        res.status(500).send("Lỗi server khi tính phí.");
    }
};
