const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const { requireAuth } = require("../middleware/auth")

router.use(requireAuth)

router.get("/cart", userController.showCart)
router.get("/rules", userController.showRules)
router.get("/request", userController.showBookRequest)
router.post("/request", userController.submitBookRequest)
router.delete("/borrow/:id", userController.cancelBorrowRequest)

module.exports = router
