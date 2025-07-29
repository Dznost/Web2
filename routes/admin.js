const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const { requireAuth, requireRole } = require("../middleware/auth")

router.use(requireAuth)
router.use(requireRole(["admin"]))

router.get("/add-book", adminController.showAddBook)
router.post(
    "/add-book",
    (req, res, next) => {
        req.app.locals.upload.single("image")(req, res, next)
    },
    adminController.addBook,
)

router.get("/distribute", adminController.showDistribute)
router.post("/distribute", adminController.updateDistribution)

router.get("/statistics", adminController.showStatistics)
router.put("/book-request/:id", adminController.updateBookRequestStatus)

router.get("/ban-user", adminController.showBanUser)
router.get("/user/:id/history", adminController.getUserHistory)
router.post("/user/:id/ban", adminController.banUser)
router.post("/user/:id/unban", adminController.unbanUser)

router.delete("/books/:id", adminController.deleteBook)

// Thêm route cho chỉnh sửa sách
router.get("/books/:id/edit", adminController.showEditBook)
router.put(
    "/books/:id",
    (req, res, next) => {
        req.app.locals.upload.single("image")(req, res, next)
    },
    adminController.updateBook,
)

module.exports = router
