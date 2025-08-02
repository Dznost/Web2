const BorrowRequest = require("../models/BorrowRequest");
const User = require("../models/User");
const Notification = require("../models/notification");

exports.showUpdateStatus = (req, res) => {
    const type = req.query.type || "all";
    res.render("librarian/update-status", { title: "Cập nhật trạng thái sách", type });
};

exports.checkConfirmationCode = async (req, res) => {
    try {
        const { confirmationCode } = req.body;
        const borrowRequest = await BorrowRequest.findOne({ confirmationCode }).populate("userId").populate("bookId");
        if (!borrowRequest) return res.status(404).json({ error: "Không tìm thấy mã xác nhận" });
        res.json({ borrowRequest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
};

exports.confirmBorrow = async (req, res) => {
    try {
        const { confirmationCode, borrowDate, returnDate, notes } = req.body;
        const borrowRequest = await BorrowRequest.findOne({ confirmationCode }).populate("userId").populate("bookId");
        if (!borrowRequest) return res.status(404).json({ success: false, error: "Không tìm thấy mã xác nhận" });

        if (!borrowRequest.expectedReceiveDate) {
            return res.status(400).json({ success: false, error: "Thiếu ngày dự kiến nhận sách" });
        }

        const borrowDateObj = new Date(borrowDate);
        const expectedReceive = new Date(borrowRequest.expectedReceiveDate);
        const expectedReturn = new Date(returnDate);

        if (isNaN(borrowDateObj.getTime()) || isNaN(expectedReturn.getTime())) {
            return res.status(400).json({ success: false, error: "Ngày mượn hoặc ngày trả dự kiến không hợp lệ." });
        }

        if (borrowDateObj < expectedReceive) {
            return res.status(400).json({ success: false, error: "Ngày mượn phải bằng hoặc sau ngày dự kiến nhận sách." });
        }

        if (expectedReturn <= borrowDateObj) {
            return res.status(400).json({ success: false, error: "Ngày trả dự kiến phải sau ngày mượn." });
        }

        borrowRequest.status = "borrowed";
        borrowRequest.borrowDate = borrowDateObj;
        borrowRequest.returnDate = expectedReturn;
        if (notes) borrowRequest.notes = notes;

        const user = borrowRequest.userId;
        user.borrowHistory = user.borrowHistory || [];
        user.borrowHistory.push({
            bookId: borrowRequest.bookId._id,
            bookTitle: borrowRequest.bookTitle || borrowRequest.bookId.title,
            borrowDate: borrowDateObj,
            returnDate: expectedReturn,
            status: "borrowed",
        });
        await user.save();
        await borrowRequest.save();

        await Notification.create({
            userId: user._id,
            message: `Bạn đã mượn sách "${borrowRequest.bookId.title}" thành công. Ngày trả: ${expectedReturn.toLocaleDateString()}`,
        });

        res.json({ success: true, message: "Đã xác nhận mượn sách." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
};

exports.confirmReturn = async (req, res) => {
    try {
        const { confirmationCode, actualReturnDate, fine, notes } = req.body;
        const borrowRequest = await BorrowRequest.findOne({ confirmationCode }).populate("userId").populate("bookId");
        if (!borrowRequest) return res.status(404).json({ success: false, error: "Không tìm thấy mã xác nhận" });

        if (!borrowRequest.borrowDate || !borrowRequest.returnDate) {
            return res.status(400).json({ success: false, error: "Thiếu ngày mượn hoặc ngày trả dự kiến." });
        }

        const actualDate = new Date(actualReturnDate);
        if (isNaN(actualDate.getTime())) {
            return res.status(400).json({ success: false, error: "Ngày trả không hợp lệ." });
        }

        if (borrowRequest.returnDate && actualDate < borrowRequest.returnDate) {
            return res.status(400).json({ success: false, error: "Ngày trả thực tế không thể sớm hơn ngày trả dự kiến." });
        }

        borrowRequest.status = "returned";
        borrowRequest.actualReturnDate = actualDate;
        borrowRequest.fine = Number.parseFloat(fine) || 0;
        if (notes) borrowRequest.notes = notes;

        const user = borrowRequest.userId;
        const historyItem = user.borrowHistory?.find(
            (h) => h.bookId.toString() === borrowRequest.bookId._id.toString() && h.status === "borrowed"
        );
        if (historyItem) {
            historyItem.status = "returned";
            historyItem.actualReturnDate = actualDate;
            historyItem.fine = borrowRequest.fine;
        }
        await user.save();

        if (borrowRequest.branch && borrowRequest.bookId.branches[borrowRequest.branch] !== undefined) {
            borrowRequest.bookId.branches[borrowRequest.branch] += 1;
            await borrowRequest.bookId.save();
        }

        await borrowRequest.save();

        await Notification.create({
            userId: user._id,
            message: `Bạn đã trả sách "${borrowRequest.bookId.title}" thành công. ${fine > 0 ? `Phạt: ${fine} VND` : ''}`,
        });

        res.json({ success: true, message: "Đã xác nhận trả sách." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
};

exports.showCheckCode = (req, res) => {
    res.render("librarian/check-code", { title: "Kiểm tra mã xác nhận" });
};

exports.updateBorrowStatus = async (req, res) => {
    res.status(501).json({ error: "Đã tách chức năng, vui lòng dùng các nút riêng." });
};

exports.showPayment = async (req, res) => {
    try {
        const { confirmationCode } = req.query;

        const borrowRequest = await BorrowRequest.findOne({ confirmationCode })
            .populate("userId")
            .populate("bookId");

        if (!borrowRequest) {
            return res.status(404).render("error", {
                title: "Không tìm thấy",
                message: "Không tìm thấy mã xác nhận",
            });
        }

        if (!borrowRequest.borrowDate || !borrowRequest.actualReturnDate) {
            return res.status(400).render("error", {
                title: "Thiếu dữ liệu",
                message: "Thiếu ngày mượn hoặc ngày trả thực tế để tính phí",
            });
        }

        const borrowDays = Math.ceil((borrowRequest.actualReturnDate - borrowRequest.borrowDate) / (1000 * 60 * 60 * 24));

        let freeDays = 0;
        let feePerDay = 0;

        switch (borrowRequest.userId.role) {
            case "student":
                freeDays = 7;
                feePerDay = 5000;
                break;
            case "reader":
                freeDays = 7;
                feePerDay = 10000;
                break;
            case "teacher":
                freeDays = Infinity;
                feePerDay = 0;
                break;
            default:
                freeDays = 7;
                feePerDay = 10000;
        }

        const extraDays = Math.max(0, borrowDays - freeDays);
        const totalFine = extraDays * feePerDay;

        res.render("librarian/payment", {
            title: "Thanh toán phí mượn sách",
            borrowRequest,
            borrowDays,
            extraDays,
            feePerDay,
            totalFine,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi server");
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { confirmationCode } = req.body;

        const borrowRequest = await BorrowRequest.findOne({ confirmationCode })
            .populate("userId")
            .populate("bookId");

        if (!borrowRequest || !borrowRequest.borrowDate || !borrowRequest.actualReturnDate) {
            return res.status(400).json({ error: "Không đủ dữ liệu để xử lý" });
        }

        const borrowDays = Math.ceil((borrowRequest.actualReturnDate - borrowRequest.borrowDate) / (1000 * 60 * 60 * 24));

        let freeDays = 0;
        let feePerDay = 0;

        switch (borrowRequest.userId.role) {
            case "student":
                freeDays = 7;
                feePerDay = 5000;
                break;
            case "reader":
                freeDays = 7;
                feePerDay = 10000;
                break;
            case "teacher":
                freeDays = Infinity;
                feePerDay = 0;
                break;
            default:
                freeDays = 7;
                feePerDay = 10000;
        }

        const extraDays = Math.max(0, borrowDays - freeDays);
        const totalFine = extraDays * feePerDay;

        borrowRequest.fine = totalFine;
        borrowRequest.notes = `Tính phí tự động: ${borrowDays} ngày (${extraDays} ngày vượt hạn), ${totalFine} VND.`;
        await borrowRequest.save();

        await Notification.create({
            userId: borrowRequest.userId._id,
            message: `Bạn đã thanh toán phí mượn sách "${borrowRequest.bookId.title}". Tổng phí: ${totalFine} VND.`,
        });

        res.json({ success: true, message: "Đã thanh toán thành công." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi xử lý thanh toán" });
    }
};