const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const { requireAuth } = require("../middleware/auth")
const Notification = require('../models/notification');

router.use(requireAuth)

router.get("/cart", userController.showCart)
router.get("/rules", userController.showRules)
router.get("/request", userController.showBookRequest)
router.post("/request", userController.submitBookRequest)
router.delete("/borrow/:id", userController.cancelBorrowRequest)
router.get('/notifications', async (req, res) => {
	const notifications = await Notification.find({ userId: req.session.user.id }).sort({ createdAt: -1 })
	res.render('user/notifications', { notifications, title: 'Thông báo' })
})

module.exports = router
