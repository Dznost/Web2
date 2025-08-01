const express = require("express")
const router = express.Router()
const librarianController = require("../controllers/librarianController")
const { requireAuth, requireRole } = require("../middleware/auth")
const paymentController = require("../controllers/paymentController");


router.use(requireAuth)
router.use(requireRole(["librarian", "admin"]))

router.get("/check-code", librarianController.showCheckCode)
router.post("/check-code", librarianController.checkConfirmationCode)

// Thêm 2 route này cho xác nhận mượn và trả sách
router.post("/confirm-borrow", librarianController.confirmBorrow)
router.post("/confirm-return", librarianController.confirmReturn)

router.get("/update-status", librarianController.showUpdateStatus)
router.post("/update-status", librarianController.updateBorrowStatus)

router.get("/payment", paymentController.showPaymentForm);
router.post("/payment", paymentController.calculatePayment);

module.exports = router