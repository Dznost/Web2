const BorrowRequest = require("../models/BorrowRequest")
const User = require("../models/User")

// Trang cập nhật trạng thái (gồm 3 form)
exports.showUpdateStatus = (req, res) => {
    const type = req.query.type || "all";
    res.render("librarian/update-status", { title: "Cập nhật trạng thái sách", type });
}
// Kiểm tra mã xác nhận (POST)
exports.checkConfirmationCode = async (req, res) => {
    try {
        const { confirmationCode } = req.body
        const borrowRequest = await BorrowRequest.findOne({ confirmationCode }).populate("userId").populate("bookId")
        if (!borrowRequest) {
            return res.status(404).json({ error: "Không tìm thấy mã xác nhận" })
        }
        res.json({ borrowRequest })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Lỗi server" })
    }
}

// Xác nhận mượn sách (POST)
exports.confirmBorrow = async (req, res) => {
    try {
        const { confirmationCode, borrowDate, returnDate, notes } = req.body;
        const borrowRequest = await BorrowRequest.findOne({ confirmationCode }).populate("userId").populate("bookId");
        if (!borrowRequest) {
            return res.status(404).json({ success: false, error: "Không tìm thấy mã xác nhận" });
        }

        borrowRequest.status = "borrowed";
        borrowRequest.borrowDate = new Date(borrowDate);
        borrowRequest.returnDate = new Date(returnDate);
        if (notes) borrowRequest.notes = notes;

        // Add to user's borrow history
        const user = borrowRequest.userId;
        user.borrowHistory = user.borrowHistory || [];
        user.borrowHistory.push({
            bookId: borrowRequest.bookId._id,
            bookTitle: borrowRequest.bookTitle || borrowRequest.bookId.title,
            borrowDate: new Date(borrowDate),
            returnDate: new Date(returnDate),
            status: "borrowed",
        });
        await user.save();
        await borrowRequest.save();

        res.json({ success: true, message: "Đã xác nhận mượn sách." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
};

// Xác nhận trả sách (POST)
exports.confirmReturn = async (req, res) => {
    try {
        const { confirmationCode, actualReturnDate, fine, notes } = req.body;
        const borrowRequest = await BorrowRequest.findOne({ confirmationCode }).populate("userId").populate("bookId");
        if (!borrowRequest) {
            return res.status(404).json({ success: false, error: "Không tìm thấy mã xác nhận" });
        }

        // Kiểm tra ngày mượn
        if (!borrowRequest.borrowDate) {
            return res.status(400).json({ success: false, error: "Không tìm thấy ngày mượn của yêu cầu này." });
        }
        const borrowDate = new Date(borrowRequest.borrowDate);
        const actualDate = new Date(actualReturnDate);
        if (isNaN(actualDate.getTime())) {
            return res.status(400).json({ success: false, error: "Ngày trả thực tế không hợp lệ." });
        }
        if (actualDate <= borrowDate) {
            return res.status(400).json({ success: false, error: "Ngày trả thực tế phải lớn hơn ngày mượn!" });
        }

        borrowRequest.status = "returned";
        borrowRequest.actualReturnDate = actualDate;
        borrowRequest.fine = Number.parseFloat(fine) || 0;
        if (notes) borrowRequest.notes = notes;

        // Cập nhật lịch sử mượn của user
        const user = borrowRequest.userId;
        if (user.borrowHistory && Array.isArray(user.borrowHistory)) {
            const historyItem = user.borrowHistory.find(
                (h) => h.bookId.toString() === borrowRequest.bookId._id.toString() && h.status === "borrowed"
            );
            if (historyItem) {
                historyItem.status = "returned";
                historyItem.actualReturnDate = actualDate;
                historyItem.fine = Number.parseFloat(fine) || 0;
            }
            await user.save();
        }

        // Trả sách về kho
        const book = borrowRequest.bookId;
        if (book && borrowRequest.branch && book.branches && book.branches[borrowRequest.branch] !== undefined) {
            book.branches[borrowRequest.branch] += 1;
            await book.save();
        }

        await borrowRequest.save();
        res.json({ success: true, message: "Đã xác nhận trả sách." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
};

// Các chức năng cũ vẫn giữ nguyên nếu bạn cần
exports.showCheckCode = (req, res) => {
    res.render("librarian/check-code", { title: "Kiểm tra mã xác nhận" })
}

exports.updateBorrowStatus = async (req, res) => {
    // Đã tách chức năng, không dùng nữa
    res.status(501).json({ error: "Đã tách chức năng, vui lòng dùng các nút riêng." })
}

exports.showPayment = async (req, res) => {
    try {
        const { confirmationCode } = req.query
        const borrowRequest = await BorrowRequest.findOne({ confirmationCode }).populate("userId").populate("bookId")
        if (!borrowRequest) {
            return res.status(404).render("error", {
                title: "Không tìm thấy",
                message: "Không tìm thấy mã xác nhận",
            })
        }
        res.render("librarian/payment", {
            borrowRequest,
            title: "Thanh toán phí mượn sách",
        })
    } catch (error) {
        console.error(error)
        res.status(500).send("Server Error")
    }
}

exports.processPayment = async (req, res) => {
    try {
        const { confirmationCode, days, amount } = req.body
        const borrowRequest = await BorrowRequest.findOne({ confirmationCode })
        if (!borrowRequest) {
            return res.status(404).json({ error: "Không tìm thấy mã xác nhận" })
        }
        borrowRequest.fine = Number.parseFloat(amount) || 0
        borrowRequest.notes = `Mượn ${days} ngày, phí: ${amount} VND`
        await borrowRequest.save()
        res.json({ success: true, message: "Xử lý thanh toán thành công!" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Lỗi server" })
    }
}