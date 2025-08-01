const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

// Middleware bắt buộc đăng nhập
router.use(requireAuth);

// Hiển thị tất cả thông báo của người dùng
router.get("/", notificationController.getNotifications);

// Gửi phản hồi cho một thông báo
router.post("/reply", notificationController.replyToNotification);

module.exports = router;
