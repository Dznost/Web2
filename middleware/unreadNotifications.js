// middleware/unreadNotifications.js
const Notification = require('../models/notification')

module.exports = async (req, res, next) => {
	if (req.session.user) {
		try {
			const unread = await Notification.countDocuments({
				userId: req.session.user.id,
				isRead: false,
			})
			res.locals.unreadCount = unread
		} catch (error) {
			console.error('Notification middleware error:', error)
			res.locals.unreadCount = 0
		}
	} else {
		res.locals.unreadCount = 0
	}
	next()
}
