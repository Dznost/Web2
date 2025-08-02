const Notification = require("../models/notification");
const NotificationReply = require("../models/NotificationReply");
const User = require("../models/User");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.session.user._id })
            .sort({ createdAt: -1 })
            .lean();

        for (let notification of notifications) {
            const replies = await NotificationReply.find({ notificationId: notification._id })
                .sort({ createdAt: 1 })
                .populate("senderId", "fullName role")
                .lean();

            notification.replies = replies;
        }

        res.render("user/notifications", {
            title: "Thông báo của bạn",
            notifications,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi server khi tải thông báo.");
    }
};

exports.showReplyForm = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findById(notificationId).populate("userId");

        if (!notification) {
            return res.status(404).render("error", { title: "Lỗi", message: "Không tìm thấy thông báo" });
        }

        res.render("notifications/reply-form", {
            title: "Phản hồi thông báo",
            notification,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi server khi hiển thị form phản hồi.");
    }
};

exports.submitReply = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { message } = req.body;

        console.log("📥 submitReply received:", { notificationId, message, user: req.session.user });

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, error: "Không tìm thấy thông báo." });
        }

        await NotificationReply.create({
            notificationId,
            senderId: req.session.user.id,
            message,
        });

        const staffUsers = await User.find({ role: { $in: ["admin", "librarian"] } });

        const replyMsg = `📩 Phản hồi từ ${req.session.user.fullName} (${req.session.user.role}): "${message}"`;

        await Promise.all(
            staffUsers.map((staff) =>
                Notification.create({
                    userId: staff._id,
                    message: replyMsg,
                    isRead: false,
                })
            )
        );

        res.json({ success: true, message: "Phản hồi đã được gửi thành công!" });
    } catch (error) {
        console.error("❌ submitReply error:", error);
        res.status(500).json({ success: false, error: "Lỗi server khi gửi phản hồi." });
    }
};

exports.viewReplies = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).render("error", { title: "Lỗi", message: "Không tìm thấy thông báo" });
        }

        const replies = await NotificationReply.find({ notificationId }).populate("senderId", "fullName role");
        res.render("notifications/view-replies", {
            title: "Danh sách phản hồi",
            notification,
            replies,
        });
    } catch (error) {
        console.error("❌ viewReplies error:", error);
        res.status(500).send("Lỗi server khi hiển thị danh sách phản hồi.");
    }
};