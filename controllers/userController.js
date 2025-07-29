const BorrowRequest = require("../models/BorrowRequest")
const BookRequest = require("../models/BookRequest")
const User = require("../models/User")

exports.showCart = async (req, res) => {
  try {
    const borrowRequests = await BorrowRequest.find({
      userId: req.session.user.id,
    })
      .populate("bookId")
      .sort({ requestDate: -1 })

    res.render("user/cart", {
      borrowRequests,
      title: "Giỏ hàng của tôi",
    })
  } catch (error) {
    console.error(error)
    res.status(500).send("Server Error")
  }
}

exports.showRules = (req, res) => {
  res.render("user/rules", { title: "Quy định mượn sách" })
}

exports.showBookRequest = (req, res) => {
  res.render("user/book-request", { title: "Yêu cầu sách mới" })
}

exports.submitBookRequest = async (req, res) => {
  try {
    const { title, author, year, genre, summary, reason } = req.body

    const bookRequest = new BookRequest({
      userId: req.session.user.id,
      username: req.session.user.fullName,
      title,
      author,
      year: year ? Number.parseInt(year) : undefined,
      genre,
      summary,
      reason,
    })

    await bookRequest.save()

    res.json({
      success: true,
      message: "Yêu cầu sách đã được gửi thành công!",
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Lỗi server" })
  }
}

exports.cancelBorrowRequest = async (req, res) => {
  try {
    const borrowRequest = await BorrowRequest.findOne({
      _id: req.params.id,
      userId: req.session.user.id,
      status: "pending",
    }).populate("bookId")

    if (!borrowRequest) {
      return res.status(404).json({ error: "Không tìm thấy yêu cầu mượn sách" })
    }

    // Return book quantity
    const book = borrowRequest.bookId
    book.branches[borrowRequest.branch] += 1
    await book.save()

    // Update request status
    borrowRequest.status = "cancelled"
    await borrowRequest.save()

    res.json({ success: true, message: "Đã hủy yêu cầu mượn sách" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Lỗi server" })
  }
}
