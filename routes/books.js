const express = require("express")
const router = express.Router()
const bookController = require("../controllers/bookController")
const { requireAuth } = require("../middleware/auth")

router.get("/", bookController.getAllBooks)
router.get("/:id", bookController.getBookDetail)
router.post("/:id/comment", requireAuth, bookController.addComment)
router.get("/:id/borrow", requireAuth, bookController.showBorrowForm)
router.post("/:id/borrow", requireAuth, bookController.submitBorrowRequest)

module.exports = router
