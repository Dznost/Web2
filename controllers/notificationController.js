// controllers/notificationController.js
const Notification = require("../models/notification");
const User = require("../models/User");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.session.user._id }).sort({ createdAt: -1 });
        res.render("user/notifications", { title: "Thông báo của bạn", notifications });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi server khi tải thông báo.");
    }
};

exports.replyToNotification = async (req, res) => {
    try {
        const { notificationId, reply } = req.body;

        const notification = await Notification.findById(notificationId).populate("userId");

        if (!notification) {
            return res.status(404).json({ success: false, error: "Không tìm thấy thông báo." });
        }

        // Ghi phản hồi vào bản gốc
        notification.reply = reply;
        await notification.save();

        // Gửi phản hồi tới admin/thủ thư
        const staffUsers = await User.find({ role: { $in: ["admin", "librarian"] } });

        const replyMsg = `📩 Phản hồi từ ${notification.userId.fullName} (${notification.userId.role}): "${reply}"`;


        await Promise.all(
            staffUsers.map((staff) =>
                Notification.create({
                    userId: staff._id,
                    message: replyMsg,
                    isRead: false,
                })
            )
        );

        res.json({ success: true });
    } catch (err) {
        console.error("❌ replyToNotification error:", err);
        res.status(500).json({ success: false, error: "Lỗi server." });
    }
};
