const mongoose = require('mongoose');

const notificationReplySchema = new mongoose.Schema({
    notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationReply', notificationReplySchema);