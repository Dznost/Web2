const Reply = require("../models/Reply");

exports.submitReply = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { content } = req.body;

        const notification = await Notification.findById(notificationId);
        if (!notification) return res.status(404).json({ error: "Không tìm thấy thông báo" });

        await Reply.create({
            userId: req.session.user.id,
            notificationId,
            content,
        });

        res.json({ success: true, message: "Gửi phản hồi thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server khi gửi phản hồi" });
    }
};
